// src/app/(auth)/register/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page as self-registration is disabled
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <LoadingSpinner size={48} />
      <p className="ml-4 text-muted-foreground">Redirigiendo...</p>
    </div>
  );
}
