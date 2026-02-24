import { GoogleGenAI } from "@google/generative-ai"; // Kutubxona nomini tekshiring
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
Siz Ramazon 2026 yordamchisiz. Foydalanuvchilarga Ramazon oyi, ro'za qoidalari, duolar, Islomiy odoblar va ma'naviy masalalar bo'yicha yordam berasiz.
Sizning javoblaringiz doimo xushmuomala, iliq va dalda beruvchi bo'lishi kerak.
Agar foydalanuvchi Xorazm viloyati taqvimi haqida so'rasa, ilovadagi taqvimga tayanishini ayting.
Javoblaringizni o'zbek tilida (lotin alifbosida) bering.
`;

export async function getGeminiChatResponse(history: Message[], currentMessage: string): Promise<string> {
  // 1. Vite muhiti uchun API kalitni olish
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("Xatolik: VITE_GEMINI_API_KEY topilmadi!");
    return "Tizim sozlamalarida xatolik bor (API key missing).";
  }

  // 2. GoogleGenAI ni kalit bilan ishga tushirish (Obyekt emas, string uzatiladi)
  const genAI = new GoogleGenAI(apiKey);
  
  // 3. Modelni sozlash
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // 4. Tarixni Gemini formatiga moslash (oxirgi xabarni qo'shmagan holda)
  // Gemini chat historyda 'user' va 'model' rollari bo'lishi shart
  const chatHistory = history.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }]
  }));

  try {
    // 5. Chatni boshlash va xabarni yuborish
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
    console.error("Gemini API Error details:", error);
    
    // Agar kalit xato bo'lsa yoki limit tugagan bo'lsa
    if (error.message?.includes("API_KEY_INVALID")) {
      return "API kalit noto'g'ri. Iltimos, sozlamalarni tekshiring.";
    }
    
    return "Kechirasiz, hozirda ulanishda muammo bor. Iltimos, birozdan so'ng qayta urinib ko'ring.";
  }
}
