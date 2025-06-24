// src/app/(app)/clients/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ClientListClient } from "@/components/clients/ClientListClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/providers/AuthProvider";
import type { Client } from "@/types";
import { getClients } from "@/lib/actions/client.actions";

export default function ClientsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const primaryBranchId = user?.assignments?.[0]?.branchId;

  useEffect(() => {
    if (authLoading) return;

    if (primaryBranchId) {
      const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined;
      getClients(primaryBranchId, { search }).then(data => {
        setClients(data);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user, authLoading, primaryBranchId, searchParams]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Clientes"
        description="Administre la información de sus clientes."
        actions={
          <Link href="/clients/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        }
      />
      <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /> <p className="ml-4">Cargando clientes...</p></div>}>
        {authLoading || isLoading ? (
          <div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /> <p className="ml-4">Cargando clientes...</p></div>
        ) : !primaryBranchId ? (
          <div className="text-center text-destructive py-10">No se pudo determinar la sucursal. Acceso denegado.</div>
        ) : (
          <ClientListClient initialClients={clients} initialFilters={{ search: searchParams?.search as string }} branchId={primaryBranchId} />
        )}
      </Suspense>
    </div>
  );
}
