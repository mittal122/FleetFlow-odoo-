import prisma from "../config/db.js";

export const getFleetAnalytics = async () => {
  const vehicles = await prisma.vehicle.findMany();

  const report = [];

  for (const v of vehicles) {
    const fuel = await prisma.expense.aggregate({
      where: { vehicleId: v.id },
      _sum: { cost: true, fuelLiters: true },
    });

    const maintenance = await prisma.maintenance.aggregate({
      where: { vehicleId: v.id },
      _sum: { cost: true },
    });

    const trips = await prisma.trip.findMany({
      where: { vehicleId: v.id, status: "COMPLETED" },
    });

    const distance = trips.reduce(
      (sum, t) => sum + ((t.endOdo || 0) - t.startOdo),
      0
    );

    const fuelUsed = fuel._sum.fuelLiters || 0;

    report.push({
      vehicle: v.name,
      licensePlate: v.licensePlate,
      status: v.status,
      totalCost: (fuel._sum.cost || 0) + (maintenance._sum.cost || 0),
      kmDriven: distance,
      efficiency: fuelUsed === 0 ? 0 : (distance / fuelUsed).toFixed(2),
    });
  }

  return report;
};
