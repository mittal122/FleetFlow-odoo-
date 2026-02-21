import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { registerSchema } from '@/lib/validation';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';
import { AuditLog } from '@/lib/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors[0].message), {
        status: 422,
      });
    }

    const { email, password, name } = validation.data;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(errorResponse('Email already registered', 400), {
        status: 400,
      });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'viewer', // Default role
    });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set auth cookie
    const response = NextResponse.json(
      successResponse(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        'Registration successful',
        201
      ),
      { status: 201 }
    );

    // Set cookie on response
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: 'REGISTER',
      entityType: 'user',
      entityId: user._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      status: 'success',
    });

    return response;
  } catch (error) {
    console.error('[API] Register error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), {
      status: 500,
    });
  }
}
