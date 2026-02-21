
import express from "express";
import { register, login } from "../services/auth.service.js";
import { requestPasswordReset, resetPassword } from "../services/password.service.js";

const router = express.Router();

router.post("/forgot", async (req, res) => {
  try {
    const token = await requestPasswordReset(req.body.email);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/reset", async (req, res) => {
  try {
    await resetPassword(req.body.token, req.body.password);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

export default router;
