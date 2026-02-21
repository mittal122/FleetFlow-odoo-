'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  status: string;
  mileage: number;
  maxLoadCapacity: number;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search + filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form fields
  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [vehicleType, setVehicleType] = useState('truck');
  const [status, setStatus] = useState('active');
  const [mileage, setMileage] = useState('0');
  const [maxLoadCapacity, setMaxLoadCapacity] = useState('0');

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const res = await fetch('/api/vehicles?limit=200');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.data?.vehicles || []);
      }
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licensePlate,
          make,
          model,
          year: parseInt(year),
          vehicleType,
          status,
          mileage: parseInt(mileage) || 0,
          maxLoadCapacity: parseInt(maxLoadCapacity) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to add vehicle');
        return;
      }
      toast.success('Vehicle added successfully');
      setDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch {
      toast.error('Failed to add vehicle');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, plate: string) {
    if (!confirm(`Are you sure you want to delete vehicle "${plate}"?`)) return;
    try {
      const res = await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Vehicle ${plate} deleted`);
        setVehicles((prev) => prev.filter((v) => v._id !== id));
      } else {
        toast.error('Failed to delete vehicle');
      }
    } catch {
      toast.error('Failed to delete vehicle');
    }
  }

  function resetForm() {
    setLicensePlate('');
    setMake('');
    setModel('');
    setYear(new Date().getFullYear().toString());
    setVehicleType('truck');
    setStatus('active');
    setMileage('0');
    setMaxLoadCapacity('0');
  }

  // Client-side filtering + search
  const filteredVehicles = vehicles.filter((v) => {
    if (filterType !== 'all' && v.vehicleType !== filterType) return false;
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !v.licensePlate.toLowerCase().includes(q) &&
        !v.make.toLowerCase().includes(q) &&
        !v.model.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  function formatType(t: string) {
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Registry</h1>
          <p className="text-gray-600 mt-2">View, add, or remove every vehicle your company owns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              + New Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Vehicle Registration</DialogTitle>
              <DialogDescription>Register a new vehicle to your fleet.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plate">License Plate</Label>
                <Input id="plate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="MH 00 XX 0000" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Tata" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ace Gold" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Max Payload</Label>
                  <Input id="capacity" type="number" value={maxLoadCapacity} onChange={(e) => setMaxLoadCapacity(e.target.value)} placeholder="5000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Initial Odometer</Label>
                  <Input id="mileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="74000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by plate, make, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600 whitespace-nowrap">Type:</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
              <SelectItem value="trailer">Trailer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600 whitespace-nowrap">Status:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">In Shop</SelectItem>
              <SelectItem value="retired">Idle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Vehicles</CardTitle>
          <CardDescription>
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredVehicles.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {vehicles.length === 0
                ? 'No vehicles found. Click "+ New Vehicle" to register your first vehicle.'
                : 'No vehicles match the current filters.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">NO</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Plate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Model</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Capacity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Odometer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle, idx) => (
                    <tr key={vehicle._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 text-gray-900 font-medium">{vehicle.licensePlate}</td>
                      <td className="py-3 px-4 text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                          {formatType(vehicle.vehicleType || 'truck')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{(vehicle.maxLoadCapacity || 0).toLocaleString()} kg</td>
                      <td className="py-3 px-4 text-gray-600">{(vehicle.mileage || 0).toLocaleString()} km</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : vehicle.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                          {vehicle.status === 'retired' ? 'Idle' : vehicle.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded" onClick={() => handleDelete(vehicle._id, vehicle.licensePlate)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
