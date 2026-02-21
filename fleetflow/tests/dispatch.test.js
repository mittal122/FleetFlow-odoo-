import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetDb, seedVehicle, seedDriver, prisma } from "./helpers.js";
import {
  createTrip,
  completeTrip,
  cancelTrip,
  getTrips,
} from "../src/services/dispatch.service.js";

describe("Dispatch Service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe("createTrip", () => {
    it("should create a dispatched trip and lock vehicle + driver", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver();

      const trip = await createTrip({
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 2000,
        startOdo: 1000,
      });

      expect(trip.status).toBe("DISPATCHED");
      expect(trip.vehicleId).toBe(vehicle.id);
      expect(trip.driverId).toBe(driver.id);

      // Vehicle and driver should now be locked
      const v = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      const d = await prisma.driver.findUnique({ where: { id: driver.id } });
      expect(v.status).toBe("ON_TRIP");
      expect(d.status).toBe("ON_DUTY");
    });

    it("should reject when vehicle not found", async () => {
      const driver = await seedDriver();
      await expect(
        createTrip({ vehicleId: 99999, driverId: driver.id, cargoWeight: 100, startOdo: 0 })
      ).rejects.toThrow("Vehicle not found");
    });

    it("should reject when vehicle is not available", async () => {
      const vehicle = await seedVehicle({ status: "IN_SHOP" });
      const driver = await seedDriver();
      await expect(
        createTrip({ vehicleId: vehicle.id, driverId: driver.id, cargoWeight: 100, startOdo: 0 })
      ).rejects.toThrow("Vehicle is not available");
    });

    it("should reject when cargo exceeds capacity", async () => {
      const vehicle = await seedVehicle({ maxCapacity: 1000 });
      const driver = await seedDriver();
      await expect(
        createTrip({ vehicleId: vehicle.id, driverId: driver.id, cargoWeight: 2000, startOdo: 0 })
      ).rejects.toThrow("Cargo exceeds vehicle capacity");
    });

    it("should reject when driver not found", async () => {
      const vehicle = await seedVehicle();
      await expect(
        createTrip({ vehicleId: vehicle.id, driverId: 99999, cargoWeight: 100, startOdo: 0 })
      ).rejects.toThrow("Driver not found");
    });

    it("should reject when driver is not available", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver({ status: "ON_DUTY" });
      await expect(
        createTrip({ vehicleId: vehicle.id, driverId: driver.id, cargoWeight: 100, startOdo: 0 })
      ).rejects.toThrow("Driver is not available");
    });

    it("should reject when driver license is expired", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver({ licenseExpiry: new Date("2020-01-01") });
      await expect(
        createTrip({ vehicleId: vehicle.id, driverId: driver.id, cargoWeight: 100, startOdo: 0 })
      ).rejects.toThrow("Driver license expired");
    });
  });

  describe("completeTrip", () => {
    it("should complete a dispatched trip and release resources", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver();
      const trip = await createTrip({
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 1000,
        startOdo: 1000,
      });

      const result = await completeTrip({ tripId: trip.id, endOdo: 1500 });
      expect(result.message).toBe("Trip completed successfully");

      const t = await prisma.trip.findUnique({ where: { id: trip.id } });
      expect(t.status).toBe("COMPLETED");
      expect(t.endOdo).toBe(1500);

      const v = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(v.status).toBe("AVAILABLE");
      expect(v.odometer).toBe(1500);

      const d = await prisma.driver.findUnique({ where: { id: driver.id } });
      expect(d.status).toBe("AVAILABLE");
    });

    it("should reject completing a non-dispatched trip", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver();
      const trip = await createTrip({
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 1000,
        startOdo: 1000,
      });

      await completeTrip({ tripId: trip.id, endOdo: 1500 });

      // Already completed — trying again should fail
      await expect(
        completeTrip({ tripId: trip.id, endOdo: 2000 })
      ).rejects.toThrow("Trip cannot be completed");
    });

    it("should reject when trip not found", async () => {
      await expect(
        completeTrip({ tripId: 99999, endOdo: 100 })
      ).rejects.toThrow("Trip not found");
    });
  });

  describe("cancelTrip", () => {
    it("should cancel a dispatched trip and free resources", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver();
      const trip = await createTrip({
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 500,
        startOdo: 1000,
      });

      const result = await cancelTrip({ tripId: trip.id });
      expect(result.message).toContain("cancelled");

      const t = await prisma.trip.findUnique({ where: { id: trip.id } });
      expect(t.status).toBe("CANCELLED");

      const v = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(v.status).toBe("AVAILABLE");
    });

    it("should reject cancelling a completed trip", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver();
      const trip = await createTrip({
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 500,
        startOdo: 1000,
      });
      await completeTrip({ tripId: trip.id, endOdo: 1500 });

      await expect(cancelTrip({ tripId: trip.id })).rejects.toThrow(
        "Only dispatched trips can be cancelled"
      );
    });
  });

  describe("getTrips", () => {
    it("should list trips with filters", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver();
      await createTrip({
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 500,
        startOdo: 1000,
      });

      const all = await getTrips();
      expect(all.length).toBeGreaterThanOrEqual(1);

      const filtered = await getTrips({ status: "DISPATCHED" });
      expect(filtered.every((t) => t.status === "DISPATCHED")).toBe(true);
    });
  });
});
