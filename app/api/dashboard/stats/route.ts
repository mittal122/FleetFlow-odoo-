import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { Vehicle } from '@/lib/models/Vehicle';
import { Trip } from '@/lib/models/Trip';
import { Maintenance } from '@/lib/models/Maintenance';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

        verifyToken(token);
        await dbConnect();

        const [totalUsers, totalVehicles, totalTrips, maintenanceOverdue] = await Promise.all([
            User.countDocuments(),
            Vehicle.countDocuments(),
            Trip.countDocuments(),
            Maintenance.countDocuments({
                status: { $in: ['scheduled', 'in_progress'] },
                scheduledDate: { $lt: new Date() },
            }),
        ]);

        return NextResponse.json(
            successResponse({
                totalUsers,
                totalVehicles,
                totalTrips,
                maintenanceOverdue,
            })
        );
    } catch (error) {
        console.error('[API] Dashboard stats error:', error);
        return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
    }
}
