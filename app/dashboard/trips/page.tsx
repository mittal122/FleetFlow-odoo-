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

interface Trip {
  _id: string;
  tripNumber: string;
  driver?: { _id: string; name: string; email: string };
  origin: string;
  destination: string;
  distance?: number;
  cargoWeight?: number;
  estimatedFuelCost?: number;
  status: string;
  vehicle?: { _id: string; licensePlate: string; make: string; model: string; vehicleType?: string };
}

interface SelectOption {
  _id: string;
  name?: string;
  email?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  vehicleType?: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState<SelectOption[]>([]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);

  // Search + filter
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [estimatedFuelCost, setEstimatedFuelCost] = useState('');

  useEffect(() => {
    fetchTrips();
    fetchDriversAndVehicles();
  }, []);

  async function fetchTrips() {
    try {
      const res = await fetch('/api/trips?limit=200');
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
          cargoWeight: cargoWeight ? parseFloat(cargoWeight) : undefined,
          estimatedFuelCost: estimatedFuelCost ? parseFloat(estimatedFuelCost) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create trip');
        return;
      }
      toast.success('Trip dispatched successfully');
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
    setCargoWeight('');
    setEstimatedFuelCost('');
  }

  // Client-side search + filter
  const filteredTrips = trips.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.tripNumber?.toLowerCase().includes(q) ||
        t.origin?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.driver?.name?.toLowerCase().includes(q) ||
        t.vehicle?.licensePlate?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function formatStatus(s: string) {
    switch (s) {
      case 'in_progress': return 'On way';
      case 'completed': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Scheduled';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Dispatcher & Management</h1>
          <p className="text-gray-600 mt-2">Plan, dispatch, and track fleet trips</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) fetchDriversAndVehicles(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Trip Form</DialogTitle>
              <DialogDescription>Fill in trip details and dispatch.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Vehicle</Label>
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
                <Label htmlFor="cargoWeight">Cargo Weight (Kg)</Label>
                <Input id="cargoWeight" type="number" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} placeholder="5000" />
              </div>
              <div className="space-y-2">
                <Label>Select Driver</Label>
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
                  <Label htmlFor="origin">Origin Address</Label>
                  <Input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Mumbai" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Pune" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelCost">Estimated Fuel Cost</Label>
                <Input id="fuelCost" type="number" value={estimatedFuelCost} onChange={(e) => setEstimatedFuelCost(e.target.value)} placeholder="2500" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Dispatching...</> : 'Confirm & Dispatch Trip'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600 whitespace-nowrap">Status:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">On way</SelectItem>
              <SelectItem value="completed">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
          <CardDescription>
            Showing {filteredTrips.length} of {trips.length} trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredTrips.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {trips.length === 0
                ? 'No trips found. Click "New Trip" to dispatch your first trip.'
                : 'No trips match the current filters.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trip</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fleet Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Origin</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Destination</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{trip.tripNumber}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {trip.vehicle?.vehicleType
                          ? trip.vehicle.vehicleType.charAt(0).toUpperCase() + trip.vehicle.vehicleType.slice(1)
                          : '-'}{' '}
                        {trip.vehicle ? `${trip.vehicle.make}` : ''}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{trip.origin}</td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{trip.destination}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${trip.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : trip.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : trip.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                          {formatStatus(trip.status)}
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
