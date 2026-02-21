import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY;

export async function askGemini(messages) {
  // Gemini expects a specific format
  const prompt = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
  const body = {
    contents: prompt,
    generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
  };
  const res = await axios.post(GEMINI_API_URL, body);
  return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
}
