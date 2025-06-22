// src/app/(app)/clients/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientListClient } from "@/components/clients/ClientListClient";
import { getClients } from "@/lib/actions/client.actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export const revalidate = 0; // Revalidate on every request for dynamic data

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined;
  
  const initialFilters = { search };
  const initialClients = await getClients(initialFilters);

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
        <ClientListClient initialClients={initialClients} initialFilters={initialFilters} />
      </Suspense>
    </div>
  );
}
