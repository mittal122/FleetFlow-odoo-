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

interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  status: string;
  mileage: number;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState('active');
  const [mileage, setMileage] = useState('0');

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const res = await fetch('/api/vehicles');
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
          status,
          mileage: parseInt(mileage) || 0,
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
    setStatus('active');
    setMileage('0');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-2">Manage your vehicle fleet</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>Add a vehicle to your fleet.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plate">License Plate</Label>
                <Input id="plate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="FLEET001" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Volvo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="FH16" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage (km)</Label>
                  <Input id="mileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
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
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add Vehicle'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>Total: {vehicles.length} vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : vehicles.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No vehicles found. Click "Add Vehicle" to add your first vehicle.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">License Plate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Make/Model</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Year</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Mileage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{vehicle.licensePlate}</td>
                      <td className="py-3 px-4 text-gray-600">{vehicle.make} {vehicle.model}</td>
                      <td className="py-3 px-4 text-gray-600">{vehicle.year}</td>
                      <td className="py-3 px-4 text-gray-600">{vehicle.mileage.toLocaleString()} km</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : vehicle.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded" onClick={() => handleDelete(vehicle._id, vehicle.licensePlate)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
