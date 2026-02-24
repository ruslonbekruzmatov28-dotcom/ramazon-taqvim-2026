import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
Siz Ramazon 2026 yordamchisiz. Foydalanuvchilarga Ramazon oyi, ro'za qoidalari, duolar, Islomiy odoblar va ma'naviy masalalar bo'yicha yordam berasiz.
Sizning javoblaringiz doimo xushmuomala, iliq va dalda beruvchi bo'lishi kerak.
Agar foydalanuvchi Xorazm viloyati taqvimi haqida so'rasa, ilovadagi taqvimga tayanishini ayting.
Javoblaringizni o'zbek tilida (lotin alifbosida) bering.
`;

export async function getGeminiChatResponse(history: Message[], currentMessage: string): Promise<string> {
  // 1. API kalitni process.env orqali xavfsiz olish
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("Xatolik: GEMINI_API_KEY topilmadi!");
    throw new Error("Gemini API key is missing");
  }

  const genAI = new GoogleGenAI(apiKey);
  
  // 2. Model nomini barqaror versiyaga (gemini-1.5-flash) o'zgartirdik
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // 3. Tarixni Gemini formatiga moslash
  const contents = history.map(msg => ({
    role: msg.role === "user" ? "user" : "model", // role nomlarini aniqlashtirish
    parts: [{ text: msg.text }]
  }));

  try {
    // 4. To'g'ri chaqirish usuli (generateContent)
    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Kechirasiz, hozirda ulanishda muammo bor. Iltimos, birozdan so'ng qayta urinib ko'ring.";
  }
}
