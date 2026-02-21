import PDFDocument from "pdfkit";
import { getFleetAnalytics } from "./analytics.service.js";

export const generateReport = async (res) => {
  const data = await getFleetAnalytics();
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=report.pdf");

  doc.pipe(res);

  doc.fontSize(20).text("FleetFlow Report");

  data.forEach(v => {
    doc.moveDown().fontSize(12).text(
      `${v.vehicle} | Cost: ${v.totalCost} | Efficiency: ${v.efficiency} | ROI: ${v.roi}`
    );
  });

  doc.end();
};
