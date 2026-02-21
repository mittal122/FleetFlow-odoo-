import prisma from "../config/db.js";

export const addMaintenanceLog = async ({ vehicleId, cost, description }) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error("Vehicle not found");

  // Cannot service a vehicle already retired
  if (vehicle.status === "RETIRED")
    throw new Error("Cannot service a retired vehicle");

  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.maintenance.create({
      data: {
        vehicleId,
        cost,
        date: new Date(),
      },
    });

    // Automatically move vehicle to shop
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: "IN_SHOP" },
    });

    return log;
  });

  return result;
};

export const completeMaintenance = async ({ vehicleId, newOdometer }) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error("Vehicle not found");

  if (vehicle.status !== "IN_SHOP")
    throw new Error("Vehicle is not currently in maintenance");

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      status: "AVAILABLE",
      odometer: newOdometer ?? vehicle.odometer,
    },
  });

  return { message: "Vehicle returned to service" };
};

export const getMaintenanceHistory = async (vehicleId) => {
  const where = {};
  if (vehicleId) where.vehicleId = Number(vehicleId);

  return prisma.maintenance.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      vehicle: { select: { name: true, licensePlate: true } },
    },
  });
};
