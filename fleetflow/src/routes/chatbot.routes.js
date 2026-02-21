import express from "express";
import { askGemini } from "../services/chatbot.service.js";

const router = express.Router();

router.post("/gemini", async (req, res) => {
  try {
    const reply = await askGemini(req.body.messages);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
