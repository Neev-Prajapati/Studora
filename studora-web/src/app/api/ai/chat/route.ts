import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { file as fileTable, roomMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { fileCache } from "@/lib/fileCache";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is missing." }, { status: 500 });
    }

    const { roomId, messages } = await req.json();

    if (!roomId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "roomId and messages are required" }, { status: 400 });
    }

    // Verify membership
    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );

    if (membership.length === 0) {
      return NextResponse.json({ error: "You are not a member of this room" }, { status: 403 });
    }

    // Fetch all files in the room
    const roomFiles = await db.select().from(fileTable).where(eq(fileTable.roomId, roomId));

    // Process all files concurrently
    const fileContents = await Promise.all(roomFiles.map(async (f) => {
      try {
        if (fileCache.has(f.url)) {
          console.log(`[AI Chat] Cache hit for file: ${f.name}`);
          return fileCache.get(f.url);
        }

        console.log(`[AI Chat] Fetching file: ${f.name}`);
        const fileRes = await fetch(f.url);
        if (!fileRes.ok) return null;
        
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extName = f.name.toLowerCase();
        
        let mimeType = "text/plain";
        let extractedText = "";

        if (extName.endsWith(".pdf")) {
          mimeType = "application/pdf";
        } else if (extName.endsWith(".pptx")) {
          try {
            const JSZip = require("jszip");
            const zip = await JSZip.loadAsync(buffer);
            const slideFiles = zip.file(/^ppt\/slides\/slide\d+\.xml$/);
            
            let allText = [];
            for (const slide of slideFiles) {
              const xml = await slide.async("string");
              const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              if (text) allText.push(text);
            }
            extractedText = allText.join("\n\n");
            mimeType = "text/plain";
          } catch (err) {
            console.error("PPTX Parsing Error:", err);
            return null;
          }
        } else if (extName.endsWith(".png")) {
           mimeType = "image/png";
        } else if (extName.endsWith(".jpg") || extName.endsWith(".jpeg")) {
           mimeType = "image/jpeg";
        }

        if (extractedText) {
          const result = { text: `--- Document: ${f.name} ---\n${extractedText}` };
          fileCache.set(f.url, result);
          return result;
        } else {
          // If it's a pdf or image, send as inlineData
          const result = {
            text: `--- Document: ${f.name} (Attached) ---`,
            inlineData: { data: buffer.toString("base64"), mimeType }
          };
          fileCache.set(f.url, result);
          return result;
        }
      } catch (e) {
        console.error(`Error processing file ${f.name}`, e);
        return null;
      }
    }));

    const validFileContents = fileContents.filter(Boolean);

    const ai = new GoogleGenAI({ apiKey });

    // Construct the context prompt
    const systemPrompt = `
You are an expert AI Study Assistant for a specific study room.
I am providing you with the contents of all the study materials uploaded to this room.
Answer the user's questions based ONLY on these provided materials. If the answer is not in the materials, politely inform the user that you don't have that information in the room's documents.
Be helpful, concise, and format your answers nicely with markdown (e.g., bullet points, bold text).
    `.trim();

    let contextParts: any[] = [{ text: systemPrompt }];

    for (const content of validFileContents) {
      if (content?.text) contextParts.push({ text: content.text });
      if (content?.inlineData) contextParts.push({ inlineData: content.inlineData });
    }

    const formattedHistory = messages.map((msg: { role: string; content: string }, index: number) => {
      let parts = [{ text: msg.content }];
      
      // If this is the very first user message in the conversation, prepend the document context to it
      if (index === 0 && msg.role === 'user') {
        parts = [...contextParts, ...parts];
      }

      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });
    
    if (formattedHistory.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    console.log(`[AI Chat] Requesting completion from Gemini with ${validFileContents.length} documents...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: formattedHistory,
      config: {
        temperature: 0.4,
      }
    });

    return NextResponse.json({ 
      success: true, 
      reply: response.text 
    });
    
  } catch (error: unknown) {
    console.error("[AI Chat Route Error]", error);
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
          if (parsed.error.code === 503) {
            errorMessage = "The AI servers are currently experiencing very high demand. Please wait a few seconds and try again.";
          }
        } else {
          errorMessage = error.message;
        }
      } catch {
        errorMessage = error.message;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
