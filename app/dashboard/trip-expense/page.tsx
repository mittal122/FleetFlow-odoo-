'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export default function TripExpensePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Trip & Expense</h1>
                <p className="text-gray-600 mt-2">Track trip costs, fuel expenses, and generate invoices</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-slate-500" />
                        Coming Soon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Trip expense tracking and reporting will be available here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
