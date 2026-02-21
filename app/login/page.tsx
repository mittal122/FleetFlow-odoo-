'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      toast.success('Signed in successfully');
      // Store user data for client-side access
      localStorage.setItem('user', JSON.stringify(data.data));
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">FleetFlow</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-slate-600">Don't have an account? </span>
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Register
            </Link>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 border-t pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 text-center">Demo Credentials</p>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {[
                { role: 'Admin', email: 'zeel@gmail.com', pass: 'zeel1985' },
                { role: 'Dispatcher', email: 'dispatcher@gmail.com', pass: 'dispatcher' },
                { role: 'Driver', email: 'driver@gmail.com', pass: 'driver1985' },
                { role: 'Mechanic', email: 'mechanic@gmail.com', pass: 'mechanic' },
                { role: 'Accountant', email: 'accountant@gmail.com', pass: 'accountant' },
                { role: 'Viewer', email: 'viewer@gmail.com', pass: 'viewer1985' },
              ].map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors text-left group"
                  onClick={() => { setEmail(cred.email); setPassword(cred.pass); }}
                >
                  <span className="font-medium text-slate-700">{cred.role}</span>
                  <span className="text-slate-400 group-hover:text-slate-600">{cred.email}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">Click a role to auto-fill credentials</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
