const { GoogleGenAI } = require("@google/genai");

async function testModel() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: 'Say hi'
    });
    console.log("Success with gemini-2.5-flash-lite:", response.text);
  } catch (e) {
    console.error("Error with gemini-2.5-flash-lite:", e.message);
  }

  try {
    const response2 = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: 'Say hi'
    });
    console.log("Success with gemini-flash-latest:", response2.text);
  } catch (e) {
    console.error("Error with gemini-flash-latest:", e.message);
  }
}

testModel();
