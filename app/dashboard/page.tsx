'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Navigation, AlertCircle, Loader2 } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalVehicles: number;
  totalTrips: number;
  maintenanceOverdue: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch {
        // Use zeros on error
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (!user) return null;

  const displayStats = stats || { totalUsers: 0, totalVehicles: 0, totalTrips: 0, maintenanceOverdue: 0 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name || user?.email || 'User'}</h1>
        <p className="text-slate-600 mt-2">Here's an overview of your fleet operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : displayStats.totalUsers}
            </div>
            <p className="text-xs text-slate-500 mt-1">System users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : displayStats.totalVehicles}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active fleet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trips</CardTitle>
            <Navigation className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : displayStats.totalTrips}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : displayStats.maintenanceOverdue}
            </div>
            <p className="text-xs text-slate-500 mt-1">Overdue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access core features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/users"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center"
            >
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-slate-900">User Management</p>
            </a>
            <a
              href="/dashboard/vehicles"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center"
            >
              <Truck className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-slate-900">Fleet Management</p>
            </a>
            <a
              href="/dashboard/trips"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-center"
            >
              <Navigation className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-slate-900">Trip Planner</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
