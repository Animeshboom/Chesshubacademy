'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardIndex() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user?.role) {
        router.replace(`/dashboard/${user.role}`);
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold animate-bounce mb-4">
        ♞
      </div>
      <span className="text-sm text-muted animate-pulse">Redirecting to your dashboard...</span>
    </div>
  );
}
