import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { updateUserSchema } from '@/lib/validation';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { AuditLog } from '@/lib/models/AuditLog';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return NextResponse.json(forbiddenResponse(), { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return NextResponse.json(notFoundResponse(), { status: 404 });
    }

    return NextResponse.json(successResponse(user));
  } catch (error) {
    console.error('[API] Get user error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return NextResponse.json(forbiddenResponse(), { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors[0].message), {
        status: 422,
      });
    }

    const user = await User.findByIdAndUpdate(id, validation.data, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return NextResponse.json(notFoundResponse(), { status: 404 });
    }

    // Audit log
    await AuditLog.create({
      userId: payload.userId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: id,
      changes: validation.data,
      status: 'success',
    });

    return NextResponse.json(successResponse(user, 'User updated successfully'));
  } catch (error) {
    console.error('[API] Update user error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return NextResponse.json(forbiddenResponse(), { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json(notFoundResponse(), { status: 404 });
    }

    // Audit log
    await AuditLog.create({
      userId: payload.userId,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: id,
      status: 'success',
    });

    return NextResponse.json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    console.error('[API] Delete user error:', error);
    return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
  }
}
