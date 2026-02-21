import express from "express";
import { getDashboardStats } from "../services/dashboard.service.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  const data = await getDashboardStats(req.query);
  res.json(data);
});

export default router;
