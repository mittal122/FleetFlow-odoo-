import express from "express";
import {
  logFuelExpense,
  getVehicleOperationalCost,
  getFuelEfficiency,
  getExpenseHistory,
} from "../services/expense.service.js";

const router = express.Router();

router.get("/history", async (req, res) => {
  const result = await getExpenseHistory(req.query.vehicleId);
  res.json(result);
});

router.post("/fuel", async (req, res) => {
  try {
    const result = await logFuelExpense(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/cost/:vehicleId", async (req, res) => {
  const result = await getVehicleOperationalCost(Number(req.params.vehicleId));
  res.json(result);
});

router.get("/efficiency/:vehicleId", async (req, res) => {
  const result = await getFuelEfficiency(Number(req.params.vehicleId));
  res.json(result);
});

export default router;
