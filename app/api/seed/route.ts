import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const DEMO_USERS = [
    { name: 'Zeel (Admin)', email: 'zeel@gmail.com', password: 'zeel1985', role: 'admin' },
    { name: 'Dispatcher', email: 'dispatcher@gmail.com', password: 'dispatcher', role: 'dispatcher' },
    { name: 'Driver', email: 'driver@gmail.com', password: 'driver1985', role: 'driver' },
    { name: 'Mechanic', email: 'mechanic@gmail.com', password: 'mechanic', role: 'mechanic' },
    { name: 'Accountant', email: 'accountant@gmail.com', password: 'accountant', role: 'accountant' },
    { name: 'Viewer', email: 'viewer@gmail.com', password: 'viewer1985', role: 'viewer' },
];

export async function POST() {
    try {
        await dbConnect();

        const results: string[] = [];

        for (const u of DEMO_USERS) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                results.push(`${u.role}: already exists`);
                continue;
            }
            const hashed = await hashPassword(u.password);
            await User.create({
                name: u.name,
                email: u.email,
                password: hashed,
                role: u.role,
                status: 'active',
            });
            results.push(`${u.role}: created`);
        }

        return NextResponse.json(successResponse({ results }, 'Seed complete'));
    } catch (error) {
        console.error('[API] Seed error:', error);
        return NextResponse.json(errorResponse('Seed failed', 500), { status: 500 });
    }
}
