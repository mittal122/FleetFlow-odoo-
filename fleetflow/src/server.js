import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { authenticate } from "./utils/auth.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Public routes (no auth required)
app.use("/api/auth", authRoutes);

// Protected routes (require JWT)
app.use("/api/trips", authenticate, dispatchRoutes);
app.use("/api/maintenance", authenticate, maintenanceRoutes);
app.use("/api/expenses", authenticate, expenseRoutes);
app.use("/api/drivers", authenticate, driverRoutes);
app.use("/api/vehicles", authenticate, vehicleRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/analytics", authenticate, analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "FleetFlow running", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`FleetFlow running on port ${PORT}`);
});
