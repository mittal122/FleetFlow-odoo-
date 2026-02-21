import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetDb, seedVehicle, prisma } from "./helpers.js";
import {
  addMaintenanceLog,
  completeMaintenance,
  getMaintenanceHistory,
} from "../src/services/maintenance.service.js";

describe("Maintenance Service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe("addMaintenanceLog", () => {
    it("should create a log and move vehicle to IN_SHOP", async () => {
      const vehicle = await seedVehicle();

      const log = await addMaintenanceLog({ vehicleId: vehicle.id, cost: 500 });
      expect(log.vehicleId).toBe(vehicle.id);
      expect(log.cost).toBe(500);

      const v = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(v.status).toBe("IN_SHOP");
    });

    it("should reject for a retired vehicle", async () => {
      const vehicle = await seedVehicle({ status: "RETIRED" });

      await expect(
        addMaintenanceLog({ vehicleId: vehicle.id, cost: 200 })
      ).rejects.toThrow("Cannot service a retired vehicle");
    });

    it("should reject for a non-existent vehicle", async () => {
      await expect(
        addMaintenanceLog({ vehicleId: 99999, cost: 200 })
      ).rejects.toThrow("Vehicle not found");
    });
  });

  describe("completeMaintenance", () => {
    it("should return vehicle to AVAILABLE", async () => {
      const vehicle = await seedVehicle();
      await addMaintenanceLog({ vehicleId: vehicle.id, cost: 300 });

      const result = await completeMaintenance({
        vehicleId: vehicle.id,
        newOdometer: 1500,
      });
      expect(result.message).toContain("returned to service");

      const v = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(v.status).toBe("AVAILABLE");
      expect(v.odometer).toBe(1500);
    });

    it("should reject when vehicle is not in maintenance", async () => {
      const vehicle = await seedVehicle();

      await expect(
        completeMaintenance({ vehicleId: vehicle.id })
      ).rejects.toThrow("Vehicle is not currently in maintenance");
    });
  });

  describe("getMaintenanceHistory", () => {
    it("should return all maintenance logs", async () => {
      const vehicle = await seedVehicle();
      await addMaintenanceLog({ vehicleId: vehicle.id, cost: 100 });
      await addMaintenanceLog({ vehicleId: vehicle.id, cost: 200 });

      const history = await getMaintenanceHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by vehicleId", async () => {
      const v1 = await seedVehicle();
      const v2 = await seedVehicle();
      await addMaintenanceLog({ vehicleId: v1.id, cost: 100 });
      await addMaintenanceLog({ vehicleId: v2.id, cost: 200 });

      const history = await getMaintenanceHistory(v1.id);
      expect(history.every((m) => m.vehicleId === v1.id)).toBe(true);
    });
  });
});
