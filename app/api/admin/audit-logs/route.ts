import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AuditLog } from '@/lib/models/AuditLog';
import { User } from '@/lib/models/User';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return NextResponse.json(forbiddenResponse(), { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    const filter: any = {
      createdAt: {
        $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (userId) filter.userId = userId;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'email name')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    return NextResponse.json(
      successResponse({
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('[API] Get audit logs error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}
