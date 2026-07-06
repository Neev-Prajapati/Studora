import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GoogleGenAI } from "@google/genai";

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

    const { fileUrl, fileName } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });
    }

    console.log(`[AI Quiz] Fetching file from: ${fileUrl}`);
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
    
    const prompt = `
      You are an expert study assistant. I have provided you with a document.
      Your task is to generate a 5-question multiple choice practice quiz based on the key concepts in this document.
      
      Return the output as a JSON array where each object has:
      - "question": string
      - "options": string array (length 4)
      - "correctAnswer": string
    `;

    console.log("[AI Quiz] Requesting completion from Gemini with document...");
    
    let parts: any[] = [{ text: prompt }];
    
    if (extractedText) {
      parts.unshift({ text: "Document Content:\n" + extractedText });
    } else {
      parts.unshift({ inlineData: { data: buffer.toString("base64"), mimeType } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: "user",
          parts: parts
        }
      ],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    const output = response.text || "";
    let cleanOutput = output.trim();

    try {
      const quiz = JSON.parse(cleanOutput);
      return NextResponse.json({ success: true, quiz });
    } catch (parseError) {
      console.error("Failed to parse Gemini output:", output);
      return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 });
    }
    
  } catch (error) {
    console.error("[AI Quiz Route Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
