// src/app/(app)/clients/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/ClientForm";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function NewClientPage() {
  const { user, loading } = useAuth();
  
  // Use the user's primary branch assignment. In a multi-assignment scenario, a selector might be needed.
  const primaryBranchId = user?.assignments?.[0]?.branchId;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={32} />
        <p className="ml-2">Cargando contexto de usuario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Cliente"
        description="Complete los detalles para registrar un nuevo cliente."
      />
      <Card className="shadow-xl">
        <CardContent className="p-6">
          {primaryBranchId ? (
            <ClientForm branchId={primaryBranchId} />
          ) : (
            <p className="text-destructive text-center">No se pudo determinar la sucursal del usuario. No se puede crear un cliente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
