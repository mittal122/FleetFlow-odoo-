'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Trip {
  _id: string;
  tripNumber: string;
  driver?: { _id: string; name: string; email: string };
  origin: string;
  destination: string;
  distance?: number;
  status: string;
  vehicle?: { _id: string; licensePlate: string; make: string; model: string };
}

interface SelectOption {
  _id: string;
  name?: string;
  email?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState<SelectOption[]>([]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);

  // Form
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');

  useEffect(() => {
    fetchTrips();
    fetchDriversAndVehicles();
  }, []);

  async function fetchTrips() {
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.data?.trips || []);
      }
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDriversAndVehicles() {
    try {
      const [usersRes, vehiclesRes] = await Promise.all([
        fetch('/api/admin/users?limit=100'),
        fetch('/api/vehicles?limit=100'),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setDrivers(data.data?.users || []);
      }
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(data.data?.vehicles || []);
      }
    } catch {
      // ignore
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle,
          driver,
          origin,
          destination,
          distance: distance ? parseFloat(distance) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create trip');
        return;
      }
      toast.success('Trip created successfully');
      setDialogOpen(false);
      resetForm();
      fetchTrips();
    } catch {
      toast.error('Failed to create trip');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setVehicle('');
    setDriver('');
    setOrigin('');
    setDestination('');
    setDistance('');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-2">Plan and track fleet trips</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) fetchDriversAndVehicles(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Create Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>Plan a new fleet trip with vehicle and driver assignment.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={vehicle} onValueChange={setVehicle}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length === 0 ? (
                      <SelectItem value="_none" disabled>No vehicles available</SelectItem>
                    ) : (
                      vehicles.map((v) => (
                        <SelectItem key={v._id} value={v._id}>{v.licensePlate} - {v.make} {v.model}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Select value={driver} onValueChange={setDriver}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <SelectItem value="_none" disabled>No drivers available</SelectItem>
                    ) : (
                      drivers.map((d) => (
                        <SelectItem key={d._id} value={d._id}>{d.name} ({d.email})</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="New York" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Boston" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km, optional)</Label>
                <Input id="distance" type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="215" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Trip'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
          <CardDescription>Total: {trips.length} trips</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : trips.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No trips found. Click "Create Trip" to plan your first trip.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trip #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Driver</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Route</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Distance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{trip.tripNumber}</td>
                      <td className="py-3 px-4 text-gray-600">{trip.driver?.name || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-gray-600">{trip.origin} → {trip.destination}</td>
                      <td className="py-3 px-4 text-gray-600">{trip.distance ? `${trip.distance} km` : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${trip.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : trip.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : trip.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                          {trip.status.replace('_', ' ')}
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
