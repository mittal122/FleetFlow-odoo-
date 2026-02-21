import prisma from "../config/db.js";

export const createTrip = async ({ vehicleId, driverId, cargoWeight, startOdo }) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error("Vehicle not found");

  if (vehicle.status !== "AVAILABLE")
    throw new Error("Vehicle is not available");

  if (cargoWeight > vehicle.maxCapacity)
    throw new Error("Cargo exceeds vehicle capacity");

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error("Driver not found");

  if (driver.status !== "AVAILABLE")
    throw new Error("Driver is not available");

  if (new Date(driver.licenseExpiry) < new Date())
    throw new Error("Driver license expired");

  // Transaction ensures atomic update
  const trip = await prisma.$transaction(async (tx) => {
    const newTrip = await tx.trip.create({
      data: {
        vehicleId,
        driverId,
        cargoWeight,
        startOdo,
        status: "DISPATCHED",
      },
    });

    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: "ON_TRIP" },
    });

    await tx.driver.update({
      where: { id: driverId },
      data: { status: "ON_DUTY" },
    });

    return newTrip;
  });

  return trip;
};

export const completeTrip = async ({ tripId, endOdo }) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new Error("Trip not found");

  if (trip.status !== "DISPATCHED")
    throw new Error("Trip cannot be completed");

  await prisma.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: tripId },
      data: { status: "COMPLETED", endOdo },
    });

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: "AVAILABLE",
        odometer: endOdo,
      },
    });

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "AVAILABLE" },
    });
  });

  return { message: "Trip completed successfully" };
};

export const cancelTrip = async ({ tripId }) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new Error("Trip not found");

  if (trip.status !== "DISPATCHED")
    throw new Error("Only dispatched trips can be cancelled");

  await prisma.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED" },
    });

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "AVAILABLE" },
    });

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "AVAILABLE" },
    });
  });

  return { message: "Trip cancelled — vehicle and driver released" };
};

export const getTrips = async (filter) => {
  const where = {};
  if (filter?.status) where.status = filter.status;
  if (filter?.vehicleId) where.vehicleId = Number(filter.vehicleId);
  if (filter?.driverId) where.driverId = Number(filter.driverId);

  return prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { name: true, licensePlate: true } },
      driver: { select: { name: true } },
    },
  });
};
