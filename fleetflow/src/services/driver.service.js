import prisma from "../config/db.js";

export const createDriver = async (data) => {
  return prisma.driver.create({
    data: {
      name: data.name,
      licenseExpiry: new Date(data.licenseExpiry),
      status: "AVAILABLE",
    },
  });
};

export const getDrivers = async () => {
  return prisma.driver.findMany({ orderBy: { id: "desc" } });
};

export const getAvailableDrivers = async () => {
  return prisma.driver.findMany({
    where: { status: "AVAILABLE" },
  });
};

export const verifyDriverCompliance = async (driverId) => {
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error("Driver not found");

  if (driver.status === "SUSPENDED") throw new Error("Driver is suspended");

  if (new Date(driver.licenseExpiry) < new Date())
    throw new Error("License expired");

  return { compliant: true };
};

export const updateDriverStatus = async (driverId, status) => {
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error("Driver not found");

  await prisma.driver.update({
    where: { id: driverId },
    data: { status },
  });

  return { message: `Driver status updated to ${status}` };
};

export const getDriverPerformance = async (driverId) => {
  const trips = await prisma.trip.findMany({
    where: { driverId },
  });

  const completed = trips.filter((t) => t.status === "COMPLETED").length;
  const total = trips.length;

  const completionRate = total === 0 ? 0 : (completed / total) * 100;

  return {
    driverId,
    totalTrips: total,
    completedTrips: completed,
    completionRate: completionRate.toFixed(2) + "%",
  };
};
