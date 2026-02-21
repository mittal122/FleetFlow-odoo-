'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AuditLogEntry {
  _id: string;
  userId?: { name: string; email: string };
  action: string;
  entityType: string;
  entityId: string;
  status: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.data?.logs || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  function formatAction(action: string) {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-2">System activity and compliance tracking</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Total: {logs.length} actions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No audit logs found. Logs will appear as actions are performed.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{log.userId?.name || log.userId?.email || 'System'}</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{formatAction(log.action)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{log.entityType} · {log.entityId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
