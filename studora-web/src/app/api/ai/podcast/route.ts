import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { fileCache } from "@/lib/fileCache";
import { db } from "@/db";
import { file } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is missing. Did you add it to .env.local and restart the server?" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const { fileUrl, fileName, fileId } = await req.json();

    if (!fileUrl || !fileId) {
      return NextResponse.json({ error: "fileUrl and fileId are required" }, { status: 400 });
    }

    // Check if script already exists in DB
    const existingFile = await db.select({ podcastScript: file.podcastScript }).from(file).where(eq(file.id, fileId)).limit(1);
    if (existingFile.length > 0 && existingFile[0].podcastScript) {
      return NextResponse.json({ success: true, script: existingFile[0].podcastScript });
    }

    console.log(`[AI Podcast] Fetching file from: ${fileUrl}`);
    
    const prompt = `
      You are an engaging, energetic AI study podcast host. I have provided you with a document.
      Your task is to generate a conversational, 1-3 minute script summarizing the core concepts in this document.
      Make it sound natural, easy to understand, and fun. Use short sentences and natural transitions.
      Do not include any formatting, markdown, brackets like [Host laughs], or speaker labels (like Host:). 
      Just write the raw text exactly as it should be spoken aloud by a text-to-speech engine.
      Start with a welcoming intro, summarize the key points, and end with an encouraging sign-off.
    `;
    
    let parts: any[] = [{ text: prompt }];

    if (fileCache.has(fileUrl)) {
      console.log(`[AI Podcast] Cache hit for file: ${fileUrl}`);
      const cached = fileCache.get(fileUrl);
      if (cached?.text) {
        parts.unshift({ text: "Document Content:\n" + cached.text });
      } else if (cached?.inlineData) {
        parts.unshift({ inlineData: cached.inlineData });
      }
    } else {
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) {
        return NextResponse.json({ error: "Failed to download file from storage" }, { status: 400 });
      }

      const arrayBuffer = await fileRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extName = fileName?.toLowerCase() || fileUrl.toLowerCase();
      
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
          return NextResponse.json({ error: "Could not read PPTX file" }, { status: 400 });
        }
      } else if (extName.endsWith(".png")) mimeType = "image/png";
      else if (extName.endsWith(".jpg") || extName.endsWith(".jpeg")) mimeType = "image/jpeg";
      
      if (extractedText) {
        if (extractedText.length > 50000) extractedText = extractedText.substring(0, 50000) + "\n...[Content Truncated]...";
        const result = { text: `--- Document: ${fileName} ---\n${extractedText}` };
        fileCache.set(fileUrl, result);
        parts.unshift({ text: "Document Content:\n" + result.text });
      } else {
        const result = {
          text: `--- Document: ${fileName} (Attached) ---`,
          inlineData: { data: buffer.toString("base64"), mimeType }
        };
        fileCache.set(fileUrl, result);
        parts.unshift({ inlineData: result.inlineData });
      }
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: "user",
            parts: parts
          }
        ],
        config: {
          temperature: 0.7,
        }
      });
    } catch (apiError: any) {
      if (apiError.message?.includes("503") || apiError.message?.includes("429")) {
        console.log("[AI Podcast] Caught 503/429, retrying once...");
        await new Promise(r => setTimeout(r, 2000));
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: "user",
              parts: parts
            }
          ],
          config: {
            temperature: 0.7,
          }
        });
      } else {
        throw apiError;
      }
    }

    const script = response.text || "";
    
    // Save to DB so we don't re-generate next time
    await db.update(file).set({ podcastScript: script }).where(eq(file.id, fileId));

    return NextResponse.json({ success: true, script });
    
  } catch (error: unknown) {
    console.error("[AI Podcast Route Error]", error);
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
