import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export const getGeminiChatResponse = async (history: Message[]): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY topilmadi!");
    return "Xatolik: API_KEY sozlanmagan. Iltimos, Vercel sozlamalarida API_KEY o'rnatilganligini tekshiring va loyihani 'Redeploy' qiling.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Tarixni Gemini formatiga o'tkazish
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: 'Siz Oʻzbekistondagi foydalanuvchilar uchun Ramazon yordamchisisiz. Oʻzbek tilida (kirill yoki lotin, foydalanuvchi qaysi tilda yozsa o\'sha tilda) javob bering. Roʻza qoidalari (fiqh), duolar, taqvim va maʼnaviy maslahatlar bering. Javoblar qisqa, samimiy va tushunarli boʻlsin. Hozirgi yil 2026. Xorazm viloyati uchun vaqtlar Urganch shahri asosida hisoblangan.',
        temperature: 0.7,
      }
    });

    return response.text || "Kechirasiz, javob olishda muammo bo'ldi.";
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    
    if (error.message?.includes('403') || error.message?.includes('API key')) {
      return "Xatolik: API kaliti noto'g'ri yoki ruxsat etilmagan. Iltimos, Vercel-dagi API_KEY qiymatini tekshiring.";
    }
    
    if (error.message?.includes('429')) {
      return "Hozirda so'rovlar juda ko'p. Iltimos, birozdan so'ng qayta urinib ko'ring.";
    }

    return "AI bilan bog'lanishda texnik nosozlik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.";
  }
};
