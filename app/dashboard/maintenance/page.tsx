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

interface MaintenanceTask {
  _id: string;
  vehicle?: { _id: string; licensePlate: string; make: string; model: string };
  type: string;
  description?: string;
  scheduledDate: string;
  completedDate?: string;
  status: string;
  cost?: number;
  mechanic?: { _id: string; name: string; email: string };
}

interface SelectOption {
  _id: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  name?: string;
  email?: string;
}

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState<SelectOption[]>([]);
  const [mechanicOptions, setMechanicOptions] = useState<SelectOption[]>([]);

  // Form
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('general');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [cost, setCost] = useState('');
  const [mechanicId, setMechanicId] = useState('');

  useEffect(() => {
    fetchMaintenance();
  }, []);

  async function fetchMaintenance() {
    try {
      const res = await fetch('/api/maintenance');
      if (res.ok) {
        const data = await res.json();
        setMaintenance(data.data?.maintenance || []);
      }
    } catch {
      toast.error('Failed to load maintenance tasks');
    } finally {
      setLoading(false);
    }
  }

  async function fetchOptions() {
    try {
      const [vehiclesRes, usersRes] = await Promise.all([
        fetch('/api/vehicles?limit=100'),
        fetch('/api/admin/users?limit=100'),
      ]);
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicleOptions(data.data?.vehicles || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setMechanicOptions(data.data?.users || []);
      }
    } catch {
      // ignore
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle: vehicleId,
          type,
          description: description || undefined,
          scheduledDate,
          cost: cost ? parseFloat(cost) : undefined,
          mechanic: mechanicId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to schedule maintenance');
        return;
      }
      toast.success('Maintenance scheduled successfully');
      setDialogOpen(false);
      resetForm();
      fetchMaintenance();
    } catch {
      toast.error('Failed to schedule maintenance');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setVehicleId('');
    setType('general');
    setDescription('');
    setScheduledDate('');
    setCost('');
    setMechanicId('');
  }

  function formatType(t: string) {
    return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-600 mt-2">Schedule and track vehicle maintenance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) fetchOptions(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Maintenance</DialogTitle>
              <DialogDescription>Schedule a maintenance task for a vehicle.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleOptions.length === 0 ? (
                      <SelectItem value="_none" disabled>No vehicles available</SelectItem>
                    ) : (
                      vehicleOptions.map((v) => (
                        <SelectItem key={v._id} value={v._id}>{v.licensePlate} - {v.make} {v.model}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oil_change">Oil Change</SelectItem>
                    <SelectItem value="tire_replacement">Tire Replacement</SelectItem>
                    <SelectItem value="brake_inspection">Brake Inspection</SelectItem>
                    <SelectItem value="engine_service">Engine Service</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedDate">Scheduled Date</Label>
                  <Input id="schedDate" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Est. Cost (optional)</Label>
                  <Input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign Mechanic (optional)</Label>
                <Select value={mechanicId} onValueChange={setMechanicId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a mechanic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {mechanicOptions.map((m) => (
                      <SelectItem key={m._id} value={m._id}>{m.name} ({m.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</> : 'Schedule'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tasks</CardTitle>
          <CardDescription>Total: {maintenance.length} tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : maintenance.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No maintenance tasks found. Click "Schedule Maintenance" to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vehicle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Service Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map((task) => (
                    <tr key={task._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{task.vehicle?.licensePlate || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{formatType(task.type)}</td>
                      <td className="py-3 px-4 text-gray-600">{new Date(task.scheduledDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : task.status === 'scheduled'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{task.cost ? `$${task.cost}` : '-'}</td>
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
