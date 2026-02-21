import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(unauthorizedResponse(), { status: 401 });
    }

    const payload = verifyToken(token);
    await dbConnect();

    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return NextResponse.json(errorResponse('User not found', 404), { status: 404 });
    }

    return NextResponse.json(successResponse(user));
  } catch (error) {
    console.error('[API] Get user error:', error);
    return NextResponse.json(unauthorizedResponse(), { status: 401 });
  }
}
