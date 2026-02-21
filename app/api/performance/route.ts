import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { Trip } from '@/lib/models/Trip';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

        verifyToken(token);
        await dbConnect();

        // Get all drivers
        const drivers = await User.find({ role: 'driver' })
            .select('name email licenseNumber licenseExpiry safetyScore complaints')
            .lean();

        // Compute completion rates per driver
        const driverIds = drivers.map((d: any) => d._id);
        const tripStats = await Trip.aggregate([
            { $match: { driver: { $in: driverIds } } },
            {
                $group: {
                    _id: '$driver',
                    total: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                    },
                },
            },
        ]);

        const tripStatsMap: Record<string, { total: number; completed: number }> = {};
        for (const stat of tripStats) {
            tripStatsMap[stat._id.toString()] = { total: stat.total, completed: stat.completed };
        }

        const result = drivers.map((d: any) => {
            const stats = tripStatsMap[d._id.toString()] || { total: 0, completed: 0 };
            const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return {
                _id: d._id,
                name: d.name,
                email: d.email,
                licenseNumber: d.licenseNumber || '-',
                licenseExpiry: d.licenseExpiry || null,
                safetyScore: d.safetyScore ?? 100,
                complaints: d.complaints ?? 0,
                completionRate,
                totalTrips: stats.total,
                completedTrips: stats.completed,
            };
        });

        return NextResponse.json(successResponse({ drivers: result }));
    } catch (error) {
        console.error('[API] Performance error:', error);
        return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
    }
}
