import express from "express";
import {
  createDriver,
  getDrivers,
  getAvailableDrivers,
  verifyDriverCompliance,
  updateDriverStatus,
  getDriverPerformance,
} from "../services/driver.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const d = await createDriver(req.body);
    res.json(d);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const d = await getDrivers();
  res.json(d);
});

router.get("/available/list", async (req, res) => {
  const d = await getAvailableDrivers();
  res.json(d);
});

router.get("/compliance/:id", async (req, res) => {
  try {
    const result = await verifyDriverCompliance(Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/status/:id", async (req, res) => {
  try {
    const result = await updateDriverStatus(
      Number(req.params.id),
      req.body.status
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/performance/:id", async (req, res) => {
  const result = await getDriverPerformance(Number(req.params.id));
  res.json(result);
});

export default router;
