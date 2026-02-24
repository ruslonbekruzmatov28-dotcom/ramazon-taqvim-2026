import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
Siz Ramazon 2026 yordamchisiz. Foydalanuvchilarga Ramazon oyi, ro'za qoidalari, duolar, Islomiy odoblar va ma'naviy masalalar bo'yicha yordam berasiz.
Sizning javoblaringiz doimo xushmuomala, iliq va dalda beruvchi bo'lishi kerak.
Agar foydalanuvchi Xorazm viloyati taqvimi haqida so'rasa, ilovadagi taqvimga tayanishini ayting.
Javoblaringizni o'zbek tilida (lotin alifbosida) bering.
`;

export async function getGeminiChatResponse(history: Message[], currentMessage: string): Promise<string> {
  // Foydalanuvchi taqdim etgan API kalit
  const apiKey = "AIzaSyD30xLpXJkNErW--dermVpVb7b5vUC3xe4";
  
  if (!apiKey) {
    throw new Error("Gemini API key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Format history for Gemini
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text || "Kechirasiz, javob qaytarishda xatolik yuz berdi.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Kechirasiz, hozirda ulanishda muammo bor. Iltimos, birozdan so'ng qayta urinib ko'ring.";
  }
}
