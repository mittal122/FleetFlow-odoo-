import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Trip } from '@/lib/models/Trip';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { createTripSchema } from '@/lib/validation';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';
import { AuditLog } from '@/lib/models/AuditLog';

function generateTripNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TRIP-${timestamp}-${random}`;
}

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

    const filter: any = {};
    if (status) filter.status = status;

    const total = await Trip.countDocuments(filter);
    const trips = await Trip.find(filter)
      .populate('vehicle', 'licensePlate make model')
      .populate('driver', 'name email')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    return NextResponse.json(
      successResponse({
        trips,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('[API] Get trips error:', error);
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
    const validation = createTripSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors[0].message), {
        status: 422,
      });
    }

    const tripNumber = generateTripNumber();
    const trip = await Trip.create({
      ...validation.data,
      tripNumber,
      createdBy: payload.userId,
    });

    await AuditLog.create({
      userId: payload.userId,
      action: 'CREATE_TRIP',
      entityType: 'trip',
      entityId: trip._id.toString(),
      changes: { tripNumber, ...validation.data },
      status: 'success',
    });

    return NextResponse.json(successResponse(trip, 'Trip created successfully', 201), {
      status: 201,
    });
  } catch (error) {
    console.error('[API] Create trip error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}
