'use client';

/**
 * Protected Route Component
 *
 * Wraps routes that require authentication and specific permissions.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, DashboardAccess } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
  requiredDashboard?: DashboardAccess;
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredDashboard,
  fallbackUrl = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated - redirect to login
        router.push(fallbackUrl);
        return;
      }

      // Check role requirement
      if (requiredRole && !requiredRole.includes(user.role)) {
        router.push('/unauthorized');
        return;
      }

      // Check dashboard access requirement
      if (requiredDashboard) {
        const hasAccess =
          user.dashboardAccess.includes(requiredDashboard) ||
          user.dashboardAccess.includes('both');

        if (!hasAccess) {
          router.push('/unauthorized');
          return;
        }
      }

      // Check if user is active
      if (!user.isActive) {
        router.push('/account-disabled');
        return;
      }
    }
  }, [user, loading, requiredRole, requiredDashboard, fallbackUrl, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  if (user) {
    return <>{children}</>;
  }

  // Redirecting (will be handled by useEffect)
  return null;
}

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const { user } = useAuth();

  if (!user) return false;

  // Owner has all permissions
  if (user.permissions.includes('*')) return true;

  // Check for exact permission
  if (user.permissions.includes(permission)) return true;

  // Check for wildcard permission (e.g., "jobs:*" includes "jobs:read")
  const [resource] = permission.split(':');
  const wildcardPermission = `${resource}:*`;
  if (user.permissions.includes(wildcardPermission)) return true;

  return false;
}
