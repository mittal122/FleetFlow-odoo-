import prisma from "../config/db.js";

export const getDashboardStats = async () => {
  const activeFleet = await prisma.vehicle.count({
    where: { status: "ON_TRIP" },
  });

  const maintenance = await prisma.vehicle.count({
    where: { status: "IN_SHOP" },
  });

  const totalFleet = await prisma.vehicle.count();

  const utilization =
    totalFleet === 0 ? 0 : (activeFleet / totalFleet) * 100;

  return {
    activeFleet,
    maintenanceAlerts: maintenance,
    totalFleet,
    utilizationRate: utilization.toFixed(2),
  };
};
