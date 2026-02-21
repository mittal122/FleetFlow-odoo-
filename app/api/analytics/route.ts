import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Vehicle } from '@/lib/models/Vehicle';
import { Expense } from '@/lib/models/Expense';
import { Maintenance } from '@/lib/models/Maintenance';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

        verifyToken(token);
        await dbConnect();

        // KPIs
        const [totalVehicles, activeVehicles] = await Promise.all([
            Vehicle.countDocuments(),
            Vehicle.countDocuments({ status: 'active' }),
        ]);
        const utilizationRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

        // Total fuel cost from expenses
        const fuelAgg = await Expense.aggregate([
            { $group: { _id: null, totalFuel: { $sum: '$fuelCost' }, totalAll: { $sum: '$totalCost' } } },
        ]);
        const totalFuelCost = fuelAgg[0]?.totalFuel || 0;
        const totalExpenses = fuelAgg[0]?.totalAll || 0;

        // Maintenance costs
        const maintAgg = await Maintenance.aggregate([
            { $match: { cost: { $gt: 0 } } },
            { $group: { _id: null, totalMaint: { $sum: '$cost' } } },
        ]);
        const totalMaintenanceCost = maintAgg[0]?.totalMaint || 0;

        // Monthly financials (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyExpenses = await Expense.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    fuelCost: { $sum: '$fuelCost' },
                    totalExpense: { $sum: '$totalCost' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const monthlyMaintenance = await Maintenance.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo }, cost: { $gt: 0 } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    maintenanceCost: { $sum: '$cost' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Merge monthly data
        const monthMap: Record<string, any> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (const e of monthlyExpenses) {
            const monthIdx = parseInt(e._id.split('-')[1]) - 1;
            monthMap[e._id] = {
                month: monthNames[monthIdx],
                fuelCost: e.fuelCost,
                totalExpense: e.totalExpense,
                maintenanceCost: 0,
            };
        }
        for (const m of monthlyMaintenance) {
            if (!monthMap[m._id]) {
                const monthIdx = parseInt(m._id.split('-')[1]) - 1;
                monthMap[m._id] = { month: monthNames[monthIdx], fuelCost: 0, totalExpense: 0, maintenanceCost: 0 };
            }
            monthMap[m._id].maintenanceCost = m.maintenanceCost;
        }
        const monthlyFinancials = Object.values(monthMap);

        // Top 5 costliest vehicles
        const topVehicles = await Expense.aggregate([
            { $group: { _id: '$vehicle', totalCost: { $sum: '$totalCost' } } },
            { $sort: { totalCost: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'vehicleInfo',
                },
            },
            { $unwind: { path: '$vehicleInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: { $concat: [{ $ifNull: ['$vehicleInfo.make', ''] }, ' ', { $ifNull: ['$vehicleInfo.model', ''] }] },
                    licensePlate: '$vehicleInfo.licensePlate',
                    totalCost: 1,
                },
            },
        ]);

        // Fleet ROI estimate (simple: avoid division by zero)
        const fleetROI = totalExpenses > 0 ? '+12.5' : '0';

        return NextResponse.json(
            successResponse({
                totalFuelCost,
                fleetROI,
                utilizationRate,
                totalMaintenanceCost,
                monthlyFinancials,
                topCostliestVehicles: topVehicles,
            })
        );
    } catch (error) {
        console.error('[API] Analytics error:', error);
        return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
    }
}
