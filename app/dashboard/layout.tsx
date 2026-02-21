'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users, Truck, Navigation, Wrench, BarChart3, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Fetch user from API (validates auth cookie)
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/user');
        if (!res.ok) {
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } catch {
        // Fallback to localStorage if API fails
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login');
        } else {
          setUser(JSON.parse(storedUser));
        }
      }
    }

    fetchUser();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('user');
    router.push('/login');
  }

  if (!mounted || !user) {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: BarChart3, roles: ['admin', 'dispatcher', 'driver', 'mechanic', 'accountant', 'viewer'] },
    { href: '/dashboard/users', label: 'Users', icon: Users, roles: ['admin'] },
    { href: '/dashboard/vehicles', label: 'Vehicles', icon: Truck, roles: ['admin', 'dispatcher', 'driver'] },
    { href: '/dashboard/trips', label: 'Trips', icon: Navigation, roles: ['admin', 'dispatcher', 'driver'] },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'mechanic', 'dispatcher'] },
    { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: Settings, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role || 'admin'));

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`bg-slate-900 text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} border-r border-slate-800`}>
        <div className="p-6 border-b border-slate-800">
          <h1 className={`font-bold text-xl text-blue-400 ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? 'FF' : 'FleetFlow'}
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-600 hover:text-slate-900"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name || user.email || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <span className="text-xs text-slate-500">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
