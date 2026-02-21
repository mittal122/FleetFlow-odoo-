import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { createUserSchema } from '@/lib/validation';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/lib/api-response';
import { hashPassword } from '@/lib/auth';
import { AuditLog } from '@/lib/models/AuditLog';

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
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    return NextResponse.json(
      successResponse({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('[API] Get users error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return NextResponse.json(forbiddenResponse(), { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors[0].message), {
        status: 422,
      });
    }

    const { email, password, name, role, phone } = validation.data;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(errorResponse('Email already exists', 400), { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      phone,
    });

    // Audit log
    await AuditLog.create({
      userId: payload.userId,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: user._id.toString(),
      changes: { email, name, role },
      status: 'success',
    });

    return NextResponse.json(
      successResponse(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        'User created successfully',
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Create user error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}
