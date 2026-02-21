import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resetDb, seedVehicle, seedDriver, prisma } from "./helpers.js";
import { createVehicle, getVehicles, retireVehicle } from "../src/services/vehicle.service.js";
import {
  createDriver,
  getDrivers,
  verifyDriverCompliance,
  getDriverPerformance,
} from "../src/services/driver.service.js";
import { createTrip, completeTrip } from "../src/services/dispatch.service.js";

describe("Vehicle Service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("should create a vehicle", async () => {
    const v = await createVehicle({
      name: "New Truck",
      licensePlate: "NV-0001",
      maxCapacity: 3000,
    });
    expect(v.name).toBe("New Truck");
    expect(v.status).toBe("AVAILABLE");
  });

  it("should list all vehicles", async () => {
    await seedVehicle();
    await seedVehicle();
    const list = await getVehicles();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it("should retire a vehicle", async () => {
    const v = await seedVehicle();
    const retired = await retireVehicle(v.id);
    expect(retired.status).toBe("RETIRED");
  });
});

describe("Driver Service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("should create a driver", async () => {
    const d = await createDriver({
      name: "New Driver",
      licenseExpiry: "2027-06-01",
    });
    expect(d.name).toBe("New Driver");
    expect(d.status).toBe("AVAILABLE");
  });

  it("should list all drivers", async () => {
    await seedDriver();
    const list = await getDrivers();
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  describe("verifyDriverCompliance", () => {
    it("should pass for valid driver", async () => {
      const d = await seedDriver();
      const result = await verifyDriverCompliance(d.id);
      expect(result.compliant).toBe(true);
    });

    it("should fail for suspended driver", async () => {
      const d = await seedDriver({ status: "SUSPENDED" });
      await expect(verifyDriverCompliance(d.id)).rejects.toThrow("suspended");
    });

    it("should fail for expired license", async () => {
      const d = await seedDriver({ licenseExpiry: new Date("2020-01-01") });
      await expect(verifyDriverCompliance(d.id)).rejects.toThrow("expired");
    });
  });

  describe("getDriverPerformance", () => {
    it("should calculate completion rate", async () => {
      const vehicle = await seedVehicle();
      const driver = await seedDriver();

      const trip = await createTrip({
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight: 1000,
        startOdo: 1000,
      });
      await completeTrip({ tripId: trip.id, endOdo: 1500 });

      const perf = await getDriverPerformance(driver.id);
      expect(perf.totalTrips).toBe(1);
      expect(perf.completedTrips).toBe(1);
      expect(perf.completionRate).toBe("100.00%");
    });
  });
});
