import express from "express";
import { createTrip, completeTrip, cancelTrip, getTrips } from "../services/dispatch.service.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const trips = await getTrips(req.query);
  res.json(trips);
});

router.post("/dispatch", async (req, res) => {
  try {
    const trip = await createTrip(req.body);
    res.json(trip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const result = await completeTrip(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/cancel", async (req, res) => {
  try {
    const result = await cancelTrip(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
