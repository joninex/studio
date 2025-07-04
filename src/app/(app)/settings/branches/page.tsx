// src/app/(app)/settings/branches/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/providers/AuthProvider";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { getBranches } from "@/lib/actions/branch.actions";
import { BranchListClient } from "@/components/settings/BranchListClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Branch } from "@/types";

// Note: This component is client-side to easily check for user role.
// The data fetching is also handled on the client side due to this constraint.
export default function BranchesPage() {
  const { user, loading: authLoading } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Only fetch branches if the user is an admin
    if (user?.role === 'admin') {
      getBranches().then(data => {
        setBranches(data);
        setIsLoading(false);
      });
    } else {
      // If user is not an admin, we don't need to load anything.
      setIsLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || isLoading) {
     return (
        <div className="flex justify-center items-center h-64">
            <LoadingSpinner size={48} /> <p className="ml-4">Cargando...</p>
        </div>
      );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">
          No tiene permisos de Super Administrador para acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Sucursales"
        description="Administre todas las tiendas o sucursales del sistema."
        actions={
          <Link href="/settings/branches/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Sucursal
            </Button>
          </Link>
        }
      />
      <BranchListClient branches={branches} />
    </div>
  );
}
