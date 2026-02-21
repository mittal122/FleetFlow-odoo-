import express from "express";
import {
  createVehicle,
  getVehicles,
  getAvailableVehicles,
  updateVehicle,
  retireVehicle,
} from "../services/vehicle.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const v = await createVehicle(req.body);
    res.json(v);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const v = await getVehicles();
  res.json(v);
});

router.get("/available/list", async (req, res) => {
  const v = await getAvailableVehicles();
  res.json(v);
});

router.put("/:id", async (req, res) => {
  try {
    const v = await updateVehicle(Number(req.params.id), req.body);
    res.json(v);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id/retire", async (req, res) => {
  try {
    const v = await retireVehicle(Number(req.params.id));
    res.json(v);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
