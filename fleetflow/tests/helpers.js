/**
 * Shared test helpers — reset DB between tests
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function resetDb() {
  // Delete in dependency order
  await prisma.trip.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedVehicle(overrides = {}) {
  return prisma.vehicle.create({
    data: {
      name: "Test Truck",
      licensePlate: `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      maxCapacity: 5000,
      odometer: 1000,
      status: "AVAILABLE",
      ...overrides,
    },
  });
}

export async function seedDriver(overrides = {}) {
  return prisma.driver.create({
    data: {
      name: "Test Driver",
      licenseExpiry: new Date("2027-01-01"),
      status: "AVAILABLE",
      ...overrides,
    },
  });
}

export { prisma };
