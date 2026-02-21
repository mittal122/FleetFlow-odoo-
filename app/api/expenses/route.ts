import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Expense } from '@/lib/models/Expense';
import { verifyToken, unauthorizedResponse } from '@/lib/auth';
import { createExpenseSchema } from '@/lib/validation';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json(unauthorizedResponse(), { status: 401 });

        verifyToken(token);
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const expenses = await Expense.find()
            .populate('trip', 'tripNumber origin destination distance status')
            .populate('driver', 'name email')
            .populate('vehicle', 'licensePlate make model')
            .sort({ createdAt: -1 })
            .limit(limit);

        return NextResponse.json(successResponse({ expenses }));
    } catch (error) {
        console.error('[API] Get expenses error:', error);
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
        const validation = createExpenseSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(validationErrorResponse(validation.error.errors[0].message), { status: 422 });
        }

        const { trip, driver, vehicle, fuelCost, miscExpenses, notes } = validation.data;
        const totalCost = fuelCost + (miscExpenses || 0);

        const expense = await Expense.create({
            trip,
            driver,
            vehicle,
            fuelCost,
            miscExpenses: miscExpenses || 0,
            totalCost,
            notes,
        });

        return NextResponse.json(
            successResponse(expense, 'Expense created successfully', 201),
            { status: 201 }
        );
    } catch (error) {
        console.error('[API] Create expense error:', error);
        return NextResponse.json(errorResponse('Internal server error', 500), { status: 500 });
    }
}
