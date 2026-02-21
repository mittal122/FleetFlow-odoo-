import prisma from "../config/db.js";

export const createVehicle = async (data) => {
  return prisma.vehicle.create({
    data: {
      name: data.name,
      licensePlate: data.licensePlate,
      maxCapacity: data.maxCapacity,
      odometer: data.odometer || 0,
      status: "AVAILABLE",
    },
  });
};

export const getVehicles = async () => {
  return prisma.vehicle.findMany({ orderBy: { id: "desc" } });
};

export const getAvailableVehicles = async () => {
  return prisma.vehicle.findMany({
    where: { status: "AVAILABLE" },
  });
};

export const updateVehicle = async (id, data) => {
  return prisma.vehicle.update({
    where: { id },
    data,
  });
};

export const retireVehicle = async (id) => {
  return prisma.vehicle.update({
    where: { id },
    data: { status: "RETIRED" },
  });
};
