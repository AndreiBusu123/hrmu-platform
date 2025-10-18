'use client';

/**
 * Dashboard Page
 *
 * Redirects users to the appropriate dashboard based on their role and permissions.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect based on dashboard access
      if (user.dashboardAccess.includes('both')) {
        router.push('/dashboard/site-manager');
      } else if (user.dashboardAccess.includes('site_manager')) {
        router.push('/dashboard/site-manager');
      } else if (user.dashboardAccess.includes('sales_marketing')) {
        router.push('/dashboard/sales');
      } else {
        router.push('/dashboard/site-manager');
      }
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
