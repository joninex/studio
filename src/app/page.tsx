// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isLoggedIn) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoggedIn, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <LoadingSpinner size={48} />
    </div>
  );
}
