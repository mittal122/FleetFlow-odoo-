import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding FleetFlow database...");


  // --- Users (Imadian style) ---
  const passwordHash = await bcrypt.hash("imadian123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "amir@imadia.io" },
    update: {},
    create: {
      email: "amir@imadia.io",
      password: passwordHash,
      name: "Amir Imadian",
      role: "ADMIN",
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: "safiya@imadia.io" },
    update: {},
    create: {
      email: "safiya@imadia.io",
      password: passwordHash,
      name: "Safiya Imadian",
      role: "DISPATCHER",
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "zayd@imadia.io" },
    update: {},
    create: {
      email: "zayd@imadia.io",
      password: passwordHash,
      name: "Zayd Imadian",
      role: "VIEWER",
    },
  });

  console.log(`  ✔ Users: ${admin.email}, ${dispatcher.email}, ${viewer.email}`);


  // --- Vehicles (Imadian style) ---
  const vehicles = await Promise.all(
    [
      { name: "Imadian Falcon", licensePlate: "IM-1001", maxCapacity: 7000, odometer: 15000 },
      { name: "Imadian Eagle", licensePlate: "IM-1002", maxCapacity: 9000, odometer: 32000 },
      { name: "Imadian Sparrow", licensePlate: "IM-2001", maxCapacity: 2000, odometer: 9500 },
      { name: "Imadian Hawk", licensePlate: "IM-1003", maxCapacity: 12000, odometer: 60000 },
      { name: "Imadian Dove", licensePlate: "IM-2002", maxCapacity: 2500, odometer: 5000 },
      { name: "Imadian Owl", licensePlate: "IM-1004", maxCapacity: 8000, odometer: 25000 },
    ].map((v) =>
      prisma.vehicle.upsert({
        where: { licensePlate: v.licensePlate },
        update: {},
        create: v,
      })
    )
  );

  console.log(`  ✔ Vehicles: ${vehicles.length} seeded`);


  // --- Drivers (Imadian style) ---
  const drivers = [];
  const driverData = [
    { name: "Imad ibn Khalid", licenseExpiry: new Date("2026-04-15") },
    { name: "Layla bint Imad", licenseExpiry: new Date("2025-12-30") },
    { name: "Samir ibn Zayd", licenseExpiry: new Date("2026-09-01") },
    { name: "Fatima bint Amir", licenseExpiry: new Date("2025-07-20") },
    { name: "Yusuf ibn Safiya", licenseExpiry: new Date("2027-02-10") },
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


  // --- Completed Trips (Imadian style) ---
  const tripData = [
    { vehicleId: vehicles[0].id, driverId: drivers[0].id, cargoWeight: 5000, startOdo: 14000, endOdo: 15000, status: "COMPLETED" },
    { vehicleId: vehicles[1].id, driverId: drivers[1].id, cargoWeight: 8500, startOdo: 31000, endOdo: 32000, status: "COMPLETED" },
    { vehicleId: vehicles[2].id, driverId: drivers[2].id, cargoWeight: 1800, startOdo: 9000, endOdo: 9500, status: "COMPLETED" },
    { vehicleId: vehicles[3].id, driverId: drivers[3].id, cargoWeight: 11000, startOdo: 59000, endOdo: 60000, status: "COMPLETED" },
    { vehicleId: vehicles[0].id, driverId: drivers[4].id, cargoWeight: 6000, startOdo: 15000, endOdo: 16000, status: "COMPLETED" },
    { vehicleId: vehicles[1].id, driverId: drivers[0].id, cargoWeight: 9000, startOdo: 32000, endOdo: 33000, status: "COMPLETED" },
  ];

  let tripCount = 0;
  for (const t of tripData) {
    await prisma.trip.create({ data: t });
    tripCount++;
  }

  console.log(`  ✔ Trips: ${tripCount} completed trips seeded`);


  // --- Expenses (Imadian style fuel records) ---
  const expenseData = [
    { vehicleId: vehicles[0].id, fuelLiters: 70, cost: 140 },
    { vehicleId: vehicles[0].id, fuelLiters: 65, cost: 130 },
    { vehicleId: vehicles[1].id, fuelLiters: 100, cost: 200 },
    { vehicleId: vehicles[1].id, fuelLiters: 95, cost: 190 },
    { vehicleId: vehicles[2].id, fuelLiters: 45, cost: 90 },
    { vehicleId: vehicles[3].id, fuelLiters: 130, cost: 260 },
    { vehicleId: vehicles[4].id, fuelLiters: 50, cost: 100 },
    { vehicleId: vehicles[5].id, fuelLiters: 80, cost: 160 },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({ data: e });
  }

  console.log(`  ✔ Expenses: ${expenseData.length} fuel records seeded`);


  // --- Maintenance records (Imadian style) ---
  const maintData = [
    { vehicleId: vehicles[3].id, cost: 1800 },
    { vehicleId: vehicles[5].id, cost: 950 },
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

  console.log("\n✅ Imadian seed complete!");
  console.log("   Login with: amir@imadia.io / imadian123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
