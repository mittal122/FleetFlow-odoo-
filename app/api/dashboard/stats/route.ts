import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
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

        const [
            totalVehicles,
            activeFleet,
            maintenanceAlerts,
            pendingCargo,
        ] = await Promise.all([
            Vehicle.countDocuments(),
            Vehicle.countDocuments({ status: 'active' }),
            Vehicle.countDocuments({ status: 'maintenance' }),
            Trip.countDocuments({ status: 'scheduled' }),
        ]);

        const utilizationRate = totalVehicles > 0
            ? Math.round((activeFleet / totalVehicles) * 100)
            : 0;

        return NextResponse.json(
            successResponse({
                activeFleet,
                maintenanceAlerts,
                utilizationRate,
                pendingCargo,
                totalVehicles,
            })
        );
    } catch (error) {
        console.error('[API] Dashboard stats error:', error);
        return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
    }
}
