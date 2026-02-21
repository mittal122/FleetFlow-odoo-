'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
    _id: string;
    trip?: { _id: string; tripNumber: string; distance?: number; status: string };
    driver?: { _id: string; name: string };
    fuelCost: number;
    miscExpenses: number;
    totalCost: number;
    status: string;
}

interface SelectOption {
    _id: string;
    name?: string;
    email?: string;
    tripNumber?: string;
    licensePlate?: string;
}

export default function TripExpensePage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    // Dropdowns
    const [trips, setTrips] = useState<SelectOption[]>([]);
    const [drivers, setDrivers] = useState<SelectOption[]>([]);

    // Form
    const [tripId, setTripId] = useState('');
    const [driverId, setDriverId] = useState('');
    const [fuelCost, setFuelCost] = useState('');
    const [miscExpenses, setMiscExpenses] = useState('');

    useEffect(() => {
        fetchExpenses();
    }, []);

    async function fetchExpenses() {
        try {
            const res = await fetch('/api/expenses');
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.data?.expenses || []);
            }
        } catch {
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    }

    async function fetchDropdowns() {
        try {
            const [tripsRes, usersRes] = await Promise.all([
                fetch('/api/trips?limit=200'),
                fetch('/api/admin/users?limit=100'),
            ]);
            if (tripsRes.ok) {
                const data = await tripsRes.json();
                setTrips(data.data?.trips || []);
            }
            if (usersRes.ok) {
                const data = await usersRes.json();
                setDrivers(data.data?.users || []);
            }
        } catch {
            // ignore
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trip: tripId,
                    driver: driverId,
                    fuelCost: parseFloat(fuelCost) || 0,
                    miscExpenses: parseFloat(miscExpenses) || 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Failed to create expense');
                return;
            }
            toast.success('Expense created successfully');
            setDialogOpen(false);
            resetForm();
            fetchExpenses();
        } catch {
            toast.error('Failed to create expense');
        } finally {
            setSaving(false);
        }
    }

    function resetForm() {
        setTripId('');
        setDriverId('');
        setFuelCost('');
        setMiscExpenses('');
    }

    const filtered = expenses.filter((ex) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            ex.trip?.tripNumber?.toLowerCase().includes(q) ||
            ex.driver?.name?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Expense & Trip Cost Tracking</h1>
                    <p className="text-gray-600 mt-2">Track fuel costs and miscellaneous trip expenses</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) fetchDropdowns(); }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4" />
                            Add an Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Expense</DialogTitle>
                            <DialogDescription>Record a trip expense.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Trip ID</Label>
                                <Select value={tripId} onValueChange={setTripId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select trip" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trips.length === 0 ? (
                                            <SelectItem value="_none" disabled>No trips</SelectItem>
                                        ) : (
                                            trips.map((t: any) => (
                                                <SelectItem key={t._id} value={t._id}>{t.tripNumber}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Driver</Label>
                                <Select value={driverId} onValueChange={setDriverId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select driver" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drivers.length === 0 ? (
                                            <SelectItem value="_none" disabled>No drivers</SelectItem>
                                        ) : (
                                            drivers.map((d: any) => (
                                                <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fuelCost">Fuel Cost</Label>
                                <Input id="fuelCost" type="number" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} placeholder="5000" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="misc">Misc Expenses</Label>
                                <Input id="misc" type="number" value={miscExpenses} onChange={(e) => setMiscExpenses(e.target.value)} placeholder="500" />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search by trip or driver..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Expenses</CardTitle>
                    <CardDescription>Showing {filtered.length} expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No expenses found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Trip ID</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Driver</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Distance</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Fuel Cost</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Misc</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((ex) => (
                                        <tr key={ex._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900 font-medium">{ex.trip?.tripNumber || '-'}</td>
                                            <td className="py-3 px-4 text-gray-600">{ex.driver?.name || '-'}</td>
                                            <td className="py-3 px-4 text-gray-600">{ex.trip?.distance ? `${ex.trip.distance} km` : '-'}</td>
                                            <td className="py-3 px-4 text-gray-600">₹{ex.fuelCost.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-gray-600">₹{ex.miscExpenses.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-gray-900 font-medium">₹{ex.totalCost.toLocaleString()}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ex.trip?.status === 'completed' ? 'bg-green-100 text-green-700'
                                                        : ex.trip?.status === 'in_progress' ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {ex.trip?.status === 'completed' ? 'Done' : ex.trip?.status === 'in_progress' ? 'On way' : ex.trip?.status || 'Pending'}
                                                </span>
                                            </td>
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
