import express from "express";
import {
  addMaintenanceLog,
  completeMaintenance,
  getMaintenanceHistory,
} from "../services/maintenance.service.js";

const router = express.Router();

router.get("/history", async (req, res) => {
  const result = await getMaintenanceHistory(req.query.vehicleId);
  res.json(result);
});

router.post("/log", async (req, res) => {
  try {
    const result = await addMaintenanceLog(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const result = await completeMaintenance(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
