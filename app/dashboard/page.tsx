'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Wrench, Gauge, Package, Plus, Search, Loader2 } from 'lucide-react';

interface DashboardStats {
  activeFleet: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
  totalVehicles: number;
}

interface Trip {
  _id: string;
  tripNumber: string;
  vehicle?: { licensePlate: string; make: string; model: string };
  driver?: { name: string };
  status: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    async function fetchData() {
      try {
        const [statsRes, tripsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/trips?limit=10'),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.data);
        }
        if (tripsRes.ok) {
          const data = await tripsRes.json();
          setTrips(data.data?.trips || []);
        }
      } catch {
        // Use zeros on error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (!user) return null;

  const s = stats || { activeFleet: 0, maintenanceAlerts: 0, utilizationRate: 0, pendingCargo: 0, totalVehicles: 0 };

  // Filter trips by search
  const filteredTrips = trips.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.tripNumber?.toLowerCase().includes(q) ||
      t.driver?.name?.toLowerCase().includes(q) ||
      t.vehicle?.licensePlate?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name || user?.email || 'User'}</h1>
        <p className="text-slate-600 mt-1">Quick snapshot of what's happening in your fleet right now</p>
      </div>

      {/* Search bar + Quick action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <Link href="/dashboard/trips">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> New Trip
            </Button>
          </Link>
          <Link href="/dashboard/vehicles">
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> New Vehicle
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Fleet</CardTitle>
            <Truck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : s.activeFleet}
            </div>
            <p className="text-xs text-slate-500 mt-1">Vehicles on the road</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Maintenance Alert</CardTitle>
            <Wrench className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : s.maintenanceAlerts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Vehicles in shop for repairs</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Cargo</CardTitle>
            <Package className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : s.pendingCargo}
            </div>
            <p className="text-xs text-slate-500 mt-1">Deliveries awaiting pickup</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Trips Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Active Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredTrips.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">No trips found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trip</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vehicle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Driver</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{trip.tripNumber}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {trip.vehicle ? `${trip.vehicle.licensePlate}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{trip.driver?.name || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${trip.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : trip.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : trip.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                          {trip.status === 'in_progress' ? 'On Trip' : trip.status.replace('_', ' ')}
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
