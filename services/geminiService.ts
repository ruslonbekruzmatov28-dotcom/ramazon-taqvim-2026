
import { GoogleGenAI, Type } from "@google/genai";
import { Message } from "../types";

export const getGeminiChatResponse = async (history: Message[], userInput: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'Siz Oʻzbekistondagi foydalanuvchilar uchun Ramazon yordamchisisiz. Oʻzbek tilida (kirill yoki lotin, foydalanuvchiga qarab) javob bering. Roʻza qoidalari (fiqh), duolar va maʼnaviy maslahatlar bering. Javoblar qisqa va tushunarli boʻlsin. Hozirgi yil 2026.',
    }
  });
  
  const response = await chat.sendMessage({ message: userInput });
  return response.text || "Узр, жавоб беришда хатолик юз берди.";
};
