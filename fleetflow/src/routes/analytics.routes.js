
import express from "express";
import { getFleetAnalytics } from "../services/analytics.service.js";
import { Parser } from "json2csv";
import { generateReport } from "../services/report.service.js";

const router = express.Router();

router.get("/export/pdf", async (req, res) => {
  await generateReport(res);
});

router.get("/fleet", async (req, res) => {
  const data = await getFleetAnalytics();
  res.json(data);
});

router.get("/export/csv", async (req, res) => {
  try {
    const data = await getFleetAnalytics();
    const fields = [
      { label: "Vehicle", value: "vehicle" },
      { label: "License Plate", value: "licensePlate" },
      { label: "Status", value: "status" },
      { label: "Total Cost", value: "totalCost" },
      { label: "KM Driven", value: "kmDriven" },
      { label: "Efficiency (km/L)", value: "efficiency" },
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=fleet-report.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate CSV" });
  }
});

export default router;
