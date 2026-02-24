import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
Siz Ramazon 2026 yordamchisiz. Foydalanuvchilarga Ramazon oyi, ro'za qoidalari, duolar, Islomiy odoblar va ma'naviy masalalar bo'yicha yordam berasiz.
Sizning javoblaringiz doimo xushmuomala, iliq va dalda beruvchi bo'lishi kerak.
Agar foydalanuvchi Xorazm viloyati taqvimi haqida so'rasa, ilovadagi taqvimga tayanishini ayting.
Javoblaringizni o'zbek tilida (lotin alifbosida) bering.
`;

export async function getGeminiChatResponse(history: Message[], currentMessage: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyD30xLpXJkNErW--dermVpVb7b5vUC3xe4";
  
  if (!apiKey) {
    console.error("Xatolik: API kalit topilmadi!");
    return "Tizim sozlamalarida xatolik bor (API key topilmadi).";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const chatHistory = history.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }]
  }));

  try {
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(currentMessage);
    const response = await result.response;
    return response.text();
    
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "Hozirda ulanishda muammo bor. Iltimos, birozdan so'ng qayta urinib ko'ring.";
  }
}
