import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { loginSchema } from '@/lib/validation';
import { comparePassword, generateToken } from '@/lib/auth';
import { errorResponse, validationErrorResponse, successResponse } from '@/lib/api-response';
import { AuditLog } from '@/lib/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors[0].message), {
        status: 422,
      });
    }

    const { email, password } = validation.data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(errorResponse('Invalid credentials', 401), {
        status: 401,
      });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      await AuditLog.create({
        userId: user._id,
        action: 'LOGIN_FAILED',
        entityType: 'user',
        entityId: user._id.toString(),
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        status: 'failure',
      });

      return NextResponse.json(errorResponse('Invalid credentials', 401), {
        status: 401,
      });
    }

    // Check status
    if (user.status !== 'active') {
      return NextResponse.json(errorResponse(`Account is ${user.status}`, 403), {
        status: 403,
      });
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const response = NextResponse.json(
      successResponse(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        'Login successful'
      )
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
      action: 'LOGIN',
      entityType: 'user',
      entityId: user._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      status: 'success',
    });

    return response;
  } catch (error) {
    console.error('[API] Login error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), {
      status: 500,
    });
  }
}
