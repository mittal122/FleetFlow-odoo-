import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Maintenance } from '@/lib/models/Maintenance';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { createMaintenanceSchema } from '@/lib/validation';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';
import { AuditLog } from '@/lib/models/AuditLog';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

    verifyToken(token);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const total = await Maintenance.countDocuments(filter);
    const maintenance = await Maintenance.find(filter)
      .populate('vehicle', 'licensePlate make model')
      .populate('mechanic', 'name email')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ scheduledDate: -1 });

    return NextResponse.json(
      successResponse({
        maintenance,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('[API] Get maintenance error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

    const payload = verifyToken(token);
    await dbConnect();

    const body = await request.json();
    const validation = createMaintenanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors[0].message), {
        status: 422,
      });
    }

    const maintenance = await Maintenance.create(validation.data);

    await AuditLog.create({
      userId: payload.userId,
      action: 'CREATE_MAINTENANCE',
      entityType: 'maintenance',
      entityId: maintenance._id.toString(),
      changes: validation.data,
      status: 'success',
    });

    return NextResponse.json(successResponse(maintenance, 'Maintenance scheduled successfully', 201), {
      status: 201,
    });
  } catch (error) {
    console.error('[API] Create maintenance error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}
