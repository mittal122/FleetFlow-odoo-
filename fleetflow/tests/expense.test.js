import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetDb, seedVehicle, seedDriver, prisma } from "./helpers.js";
import {
  logFuelExpense,
  getVehicleOperationalCost,
  getFuelEfficiency,
  getExpenseHistory,
} from "../src/services/expense.service.js";
import { createTrip, completeTrip } from "../src/services/dispatch.service.js";
import { addMaintenanceLog } from "../src/services/maintenance.service.js";

describe("Expense Service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe("logFuelExpense", () => {
    it("should log a fuel expense", async () => {
      const vehicle = await seedVehicle();

      const expense = await logFuelExpense({
        vehicleId: vehicle.id,
        liters: 50,
        cost: 100,
      });

      expect(expense.fuelLiters).toBe(50);
      expect(expense.cost).toBe(100);
      expect(expense.vehicleId).toBe(vehicle.id);
    });

    it("should reject for a retired vehicle", async () => {
      const vehicle = await seedVehicle({ status: "RETIRED" });

      await expect(
        logFuelExpense({ vehicleId: vehicle.id, liters: 10, cost: 20 })
      ).rejects.toThrow("Cannot log expense for retired vehicle");
    });
  });

  describe("getVehicleOperationalCost", () => {
    it("should aggregate fuel + maintenance costs", async () => {
      const vehicle = await seedVehicle();

      await logFuelExpense({ vehicleId: vehicle.id, liters: 50, cost: 100 });
      await logFuelExpense({ vehicleId: vehicle.id, liters: 60, cost: 120 });
      await addMaintenanceLog({ vehicleId: vehicle.id, cost: 500 });

      const result = await getVehicleOperationalCost(vehicle.id);
      expect(result.totalOperationalCost).toBe(720); // 100 + 120 + 500
    });
  });

  describe("getFuelEfficiency", () => {
    it("should calculate km per liter from completed trips", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver();

      const trip = await createTrip({
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 1000,
        startOdo: 1000,
      });
      await completeTrip({ tripId: trip.id, endOdo: 1500 }); // 500 km

      await logFuelExpense({ vehicleId: vehicle.id, liters: 100, cost: 200 });

      const result = await getFuelEfficiency(vehicle.id);
      expect(result.kmPerLiter).toBe(5); // 500km / 100L
    });

    it("should return 0 when no fuel logged", async () => {
      const vehicle = await seedVehicle();
      const result = await getFuelEfficiency(vehicle.id);
      expect(result.kmPerLiter).toBe(0);
    });
  });

  describe("getExpenseHistory", () => {
    it("should return all expenses", async () => {
      const v1 = await seedVehicle();
      const v2 = await seedVehicle();
      await logFuelExpense({ vehicleId: v1.id, liters: 30, cost: 60 });
      await logFuelExpense({ vehicleId: v2.id, liters: 40, cost: 80 });

      const all = await getExpenseHistory();
      expect(all.length).toBe(2);
    });

    it("should filter by vehicleId", async () => {
      const v1 = await seedVehicle();
      const v2 = await seedVehicle();
      await logFuelExpense({ vehicleId: v1.id, liters: 30, cost: 60 });
      await logFuelExpense({ vehicleId: v2.id, liters: 40, cost: 80 });

      const filtered = await getExpenseHistory(v1.id);
      expect(filtered.length).toBe(1);
      expect(filtered[0].vehicleId).toBe(v1.id);
    });
  });
});
