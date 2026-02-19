import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export const getGeminiChatResponse = async (history: Message[]): Promise<string> => {
  try {
    // The API key MUST be obtained from the environment variable process.env.API_KEY
   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: `Siz Oʻzbekistondagi foydalanuvchilar uchun samimiy Ramazon yordamchisisiz. 
        Asosiy vazifalaringiz:
        1. Ro'za tutish qoidalari haqida ma'lumot berish.
        2. Ma'naviy va diniy savollarga o'zbek tilida javob berish.
        3. 2026-yilgi taqvim Urganch shahri vaqti asosida ekanligini bildirish.
        Javoblaringiz do'stona bo'lsin.`,
        temperature: 0.7,
      }
    });

    return response.text || "Kechirasiz, javob olishda muammo bo'ldi.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Detailed error handling for the user without exposing sensitive details
    if (error.message?.includes('API key') || error.message?.includes('403') || error.message?.includes('not found')) {
      return "AI xizmati bilan bog'lanishda xatolik yuz berdi. Iltimos, Vercel-dagi Environment Variable nomi 'API_KEY' ekanligini va loyiha 'Redeploy' qilinganini tekshiring.";
    }
    
    return "Hozircha AI yordamchisidan javob olib bo'lmadi. Iltimos, keyinroq qayta urinib ko'ring.";
  }
};
