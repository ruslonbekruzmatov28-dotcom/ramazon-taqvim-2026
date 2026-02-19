import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "../types";

export const getGeminiChatResponse = async (history: Message[]): Promise<string> => {
  try {
    // API kalitni Environment Variable orqali olamiz
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("API key topilmadi. Vercel sozlamalarini tekshiring.");
    }

    // Yangi SDK klassini ishga tushiramiz
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Eng barqaror va bepul modelni tanlaymiz
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `Siz Oʻzbekistondagi foydalanuvchilar uchun samimiy Ramazon yordamchisisiz. 
        Asosiy vazifalaringiz:
        1. Ro'za tutish qoidalari haqida ma'lumot berish.
        2. Ma'naviy va diniy savollarga o'zbek tilida javob berish.
        3. 2026-yilgi taqvim Urganch shahri vaqti asosida ekanligini bildirish.
        Javoblaringiz do'stona bo'lsin.`,
    });

    // Chat tarixini model tushunadigan formatga o'tkazamiz
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Javobni generatsiya qilamiz
    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        temperature: 0.7,
      },
    });

    const response = await result.response;
    return response.text() || "Kechirasiz, javob olishda muammo bo'ldi.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Foydalanuvchi uchun tushunarli xato xabarlari
    if (error.message?.includes('API key') || error.message?.includes('403')) {
      return "Xatolik: AI xizmati bilan bog'lanishda muammo bo'ldi. Vercel-dagi Environment Variable nomi 'GEMINI_API_KEY' ekanligini tekshiring.";
    }
    
    return "Hozircha AI yordamchisidan javob olib bo'lmadi. Iltimos, keyinroq qayta urinib ko'ring.";
  }
};
