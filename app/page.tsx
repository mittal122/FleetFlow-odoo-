'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, Navigation, Wrench, BarChart3, Lock } from 'lucide-react';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">FleetFlow</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline" className="text-white border-slate-400 hover:bg-slate-800">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold text-white leading-tight">
            Manage Your Fleet Operations with Confidence
          </h2>
          <p className="text-xl text-slate-300">
            FleetFlow is a comprehensive fleet management system designed to streamline vehicle operations, track maintenance, and optimize your logistics workflow.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="text-white border-slate-400 hover:bg-slate-800 px-8 py-3 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-white text-center mb-12">Key Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Create and manage users with role-based access control. Admins, dispatchers, drivers, mechanics, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Truck className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Fleet Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Track vehicle information, mileage, fuel consumption, and assignments with real-time updates.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Navigation className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Trip Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Schedule and optimize trips, assign drivers and vehicles, and track progress in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Wrench className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Maintenance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Schedule preventive maintenance, track repairs, and maintain compliance with service intervals.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Generate comprehensive reports and analytics on fleet performance, costs, and utilization.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Lock className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Security & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Enterprise-grade security with role-based access, audit logs, and full compliance tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to transform your fleet?</h3>
          <p className="text-blue-100 mb-8 text-lg">Join hundreds of companies managing their fleets with FleetFlow</p>
          <Link href="/register">
            <Button className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-3 text-lg font-semibold">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 py-12 mt-20">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>&copy; 2024 FleetFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
