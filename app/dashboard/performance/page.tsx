'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface Driver {
    _id: string;
    name: string;
    email: string;
    licenseNumber: string;
    licenseExpiry: string | null;
    completionRate: number;
    safetyScore: number;
    complaints: number;
    totalTrips: number;
}

export default function PerformancePage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchPerformance() {
            try {
                const res = await fetch('/api/performance');
                if (res.ok) {
                    const data = await res.json();
                    setDrivers(data.data?.drivers || []);
                }
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        }
        fetchPerformance();
    }, []);

    const filtered = drivers.filter((d) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return d.name?.toLowerCase().includes(q) || d.licenseNumber?.toLowerCase().includes(q);
    });

    function formatExpiry(d: string | null) {
        if (!d) return '-';
        const date = new Date(d);
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).slice(-2);
        return `${m}/${y}`;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Driver Performance & Safety Profiles</h1>
                <p className="text-gray-600 mt-2">Monitor driver completion rates, safety scores, and complaints</p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search by name or license..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Driver Profiles</CardTitle>
                    <CardDescription>Showing {filtered.length} drivers</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No drivers found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">License#</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Expiry</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Completion Rate</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Safety Score</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Complaints</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((d) => (
                                        <tr key={d._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900 font-medium">{d.name}</td>
                                            <td className="py-3 px-4 text-gray-600">{d.licenseNumber}</td>
                                            <td className="py-3 px-4 text-gray-600">{formatExpiry(d.licenseExpiry)}</td>
                                            <td className="py-3 px-4">
                                                <span className={`font-medium ${d.completionRate >= 90 ? 'text-green-600' : d.completionRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {d.completionRate}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`font-medium ${d.safetyScore >= 90 ? 'text-green-600' : d.safetyScore >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {d.safetyScore}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{d.complaints}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
