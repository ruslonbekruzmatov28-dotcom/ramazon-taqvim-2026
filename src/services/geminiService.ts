import { GoogleGenAI } from "@google/generative-ai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
Siz Ramazon 2026 yordamchisiz. Foydalanuvchilarga Ramazon oyi, ro'za qoidalari, duolar, Islomiy odoblar va ma'naviy masalalar bo'yicha yordam berasiz.
Sizning javoblaringiz doimo xushmuomala, iliq va dalda beruvchi bo'lishi kerak.
Agar foydalanuvchi Xorazm viloyati taqvimi haqida so'rasa, ilovadagi taqvimga tayanishini ayting.
Javoblaringizni o'zbek tilida (lotin alifbosida) bering.
`;

export async function getGeminiChatResponse(history: Message[], currentMessage: string): Promise<string> {
  // Vite va Vercel uchun API kalitni olish
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("Xatolik: VITE_GEMINI_API_KEY topilmadi!");
    return "Tizim sozlamalarida xatolik bor (API key topilmadi).";
  }

  const genAI = new GoogleGenAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // Tarixni Gemini formatiga moslash
  const chatHistory = history.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }]
  }));

  try {
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(currentMessage);
    const response = await result.response;
    
    return response.text();
    
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return "Xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.";
  }
}
