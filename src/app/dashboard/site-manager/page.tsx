'use client';

/**
 * Site Manager Dashboard
 *
 * Main dashboard for field managers and site operations.
 */

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function SiteManagerDashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Site Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.displayName || user?.email}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>Manage and view all jobs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/jobs" className="block">
              <Button className="w-full" variant="outline">
                View Jobs List
              </Button>
            </Link>
            <Link href="/dashboard/jobs/pipeline" className="block">
              <Button className="w-full" variant="outline">
                View Pipeline (Kanban)
              </Button>
            </Link>
            <Link href="/dashboard/jobs/new" className="block">
              <Button className="w-full">
                + Create New Job
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Activities</CardTitle>
            <CardDescription>Manage job activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              View Activities
              <span className="ml-2 text-xs">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View scheduled jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              View Calendar
              <span className="ml-2 text-xs">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
            <p className="text-sm mt-2">Activity tracking coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SiteManagerPage() {
  return (
    <ProtectedRoute requiredDashboard="site_manager">
      <SiteManagerDashboard />
    </ProtectedRoute>
  );
}
