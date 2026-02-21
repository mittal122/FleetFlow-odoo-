import prisma from "../config/db.js";

export const getDashboardStats = async (filters = {}) => {
  const whereVehicle = {};
  if (filters.status) whereVehicle.status = filters.status;
  if (filters.type) whereVehicle.type = filters.type;
  if (filters.region) whereVehicle.region = filters.region;

  const activeFleet = await prisma.vehicle.count({
    where: { ...whereVehicle, status: "ON_TRIP" },
  });
  const maintenance = await prisma.vehicle.count({
    where: { ...whereVehicle, status: "IN_SHOP" },
  });
  const totalFleet = await prisma.vehicle.count({ where: whereVehicle });
  const utilization = totalFleet === 0 ? 0 : (activeFleet / totalFleet) * 100;
  const pendingCargo = await prisma.trip.count({ where: { status: "DRAFT" } });

  return {
    activeFleet,
    maintenanceAlerts: maintenance,
    totalFleet,
    utilizationRate: utilization.toFixed(2),
    pendingCargo,
  };
};
