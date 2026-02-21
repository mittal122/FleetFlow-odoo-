import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FleetFlow database...");

  // --- Users ---
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@fleetflow.io" },
    update: {},
    create: {
      email: "admin@fleetflow.io",
      password: passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: "dispatch@fleetflow.io" },
    update: {},
    create: {
      email: "dispatch@fleetflow.io",
      password: passwordHash,
      name: "Jane Dispatcher",
      role: "DISPATCHER",
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@fleetflow.io" },
    update: {},
    create: {
      email: "viewer@fleetflow.io",
      password: passwordHash,
      name: "Read Only",
      role: "VIEWER",
    },
  });

  console.log(`  ✔ Users: ${admin.email}, ${dispatcher.email}, ${viewer.email}`);

  // --- Vehicles ---
  const vehicles = await Promise.all(
    [
      { name: "Truck Alpha", licensePlate: "FL-1001", maxCapacity: 5000, odometer: 12450 },
      { name: "Truck Bravo", licensePlate: "FL-1002", maxCapacity: 8000, odometer: 34200 },
      { name: "Van Charlie", licensePlate: "FL-2001", maxCapacity: 1500, odometer: 8700 },
      { name: "Truck Delta", licensePlate: "FL-1003", maxCapacity: 10000, odometer: 56100 },
      { name: "Van Echo", licensePlate: "FL-2002", maxCapacity: 2000, odometer: 4300 },
      { name: "Truck Foxtrot", licensePlate: "FL-1004", maxCapacity: 6000, odometer: 22000 },
    ].map((v) =>
      prisma.vehicle.upsert({
        where: { licensePlate: v.licensePlate },
        update: {},
        create: v,
      })
    )
  );

  console.log(`  ✔ Vehicles: ${vehicles.length} seeded`);

  // --- Drivers ---
  const drivers = [];
  const driverData = [
    { name: "Carlos Mendez", licenseExpiry: new Date("2026-03-15") },
    { name: "Aisha Patel", licenseExpiry: new Date("2025-11-30") },
    { name: "Tom Kowalski", licenseExpiry: new Date("2026-08-01") },
    { name: "Lena Yamamoto", licenseExpiry: new Date("2025-06-20") },
    { name: "James O'Brien", licenseExpiry: new Date("2027-01-10") },
  ];

  for (const d of driverData) {
    const existing = await prisma.driver.findFirst({ where: { name: d.name } });
    if (existing) {
      drivers.push(existing);
    } else {
      drivers.push(await prisma.driver.create({ data: d }));
    }
  }

  console.log(`  ✔ Drivers: ${drivers.length} seeded`);

  // --- Completed Trips (for analytics) ---
  const tripData = [
    { vehicleId: vehicles[0].id, driverId: drivers[0].id, cargoWeight: 3200, startOdo: 12000, endOdo: 12450, status: "COMPLETED" },
    { vehicleId: vehicles[1].id, driverId: drivers[1].id, cargoWeight: 6500, startOdo: 33500, endOdo: 34200, status: "COMPLETED" },
    { vehicleId: vehicles[2].id, driverId: drivers[2].id, cargoWeight: 1100, startOdo: 8200, endOdo: 8700, status: "COMPLETED" },
    { vehicleId: vehicles[3].id, driverId: drivers[3].id, cargoWeight: 9000, startOdo: 55000, endOdo: 56100, status: "COMPLETED" },
    { vehicleId: vehicles[0].id, driverId: drivers[4].id, cargoWeight: 2800, startOdo: 12450, endOdo: 12900, status: "COMPLETED" },
    { vehicleId: vehicles[1].id, driverId: drivers[0].id, cargoWeight: 7200, startOdo: 34200, endOdo: 34850, status: "COMPLETED" },
  ];

  let tripCount = 0;
  for (const t of tripData) {
    await prisma.trip.create({ data: t });
    tripCount++;
  }

  console.log(`  ✔ Trips: ${tripCount} completed trips seeded`);

  // --- Expenses (fuel records for analytics) ---
  const expenseData = [
    { vehicleId: vehicles[0].id, fuelLiters: 60, cost: 120 },
    { vehicleId: vehicles[0].id, fuelLiters: 55, cost: 110 },
    { vehicleId: vehicles[1].id, fuelLiters: 90, cost: 180 },
    { vehicleId: vehicles[1].id, fuelLiters: 85, cost: 170 },
    { vehicleId: vehicles[2].id, fuelLiters: 35, cost: 70 },
    { vehicleId: vehicles[3].id, fuelLiters: 120, cost: 240 },
    { vehicleId: vehicles[4].id, fuelLiters: 40, cost: 80 },
    { vehicleId: vehicles[5].id, fuelLiters: 70, cost: 140 },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({ data: e });
  }

  console.log(`  ✔ Expenses: ${expenseData.length} fuel records seeded`);

  // --- Maintenance records ---
  const maintData = [
    { vehicleId: vehicles[3].id, cost: 1500 },
    { vehicleId: vehicles[5].id, cost: 800 },
  ];

  for (const m of maintData) {
    await prisma.maintenance.create({ data: m });
  }

  // Return those vehicles to AVAILABLE (maintenance is historical)
  await prisma.vehicle.updateMany({
    where: { id: { in: maintData.map((m) => m.vehicleId) } },
    data: { status: "AVAILABLE" },
  });

  console.log(`  ✔ Maintenance: ${maintData.length} records seeded`);

  console.log("\n✅ Seed complete!");
  console.log("   Login with: admin@fleetflow.io / password123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
