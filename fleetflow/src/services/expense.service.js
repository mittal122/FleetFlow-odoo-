import prisma from "../config/db.js";

export const logFuelExpense = async ({ vehicleId, liters, cost }) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error("Vehicle not found");

  if (vehicle.status === "RETIRED")
    throw new Error("Cannot log expense for retired vehicle");

  const expense = await prisma.expense.create({
    data: {
      vehicleId,
      fuelLiters: liters,
      cost,
      date: new Date(),
    },
  });

  return expense;
};

export const getVehicleOperationalCost = async (vehicleId) => {
  const fuelCosts = await prisma.expense.aggregate({
    where: { vehicleId },
    _sum: { cost: true },
  });

  const maintenanceCosts = await prisma.maintenance.aggregate({
    where: { vehicleId },
    _sum: { cost: true },
  });

  const totalCost =
    (fuelCosts._sum.cost || 0) + (maintenanceCosts._sum.cost || 0);

  return { vehicleId, totalOperationalCost: totalCost };
};

export const getFuelEfficiency = async (vehicleId) => {
  const trips = await prisma.trip.findMany({
    where: {
      vehicleId,
      status: "COMPLETED",
    },
  });

  const totalDistance = trips.reduce(
    (sum, t) => sum + ((t.endOdo || 0) - t.startOdo),
    0
  );

  const fuel = await prisma.expense.aggregate({
    where: { vehicleId },
    _sum: { fuelLiters: true },
  });

  const totalFuel = fuel._sum.fuelLiters || 0;

  if (totalFuel === 0) return { vehicleId, kmPerLiter: 0 };

  return {
    vehicleId,
    kmPerLiter: totalDistance / totalFuel,
  };
};

export const getExpenseHistory = async (vehicleId) => {
  const where = {};
  if (vehicleId) where.vehicleId = Number(vehicleId);

  return prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      vehicle: { select: { name: true, licensePlate: true } },
    },
  });
};
