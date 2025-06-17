// src/app/(app)/inventory/suppliers/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { SupplierListClient } from "@/components/inventory/SupplierListClient";
import { getSuppliers } from "@/lib/actions/supplier.actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react"; // Changed from PackagePlus
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export const revalidate = 0; // Revalidate on every request for dynamic data

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const name = typeof searchParams?.name === 'string' ? searchParams.name : undefined;
  const contactName = typeof searchParams?.contactName === 'string' ? searchParams.contactName : undefined;
  
  const initialFilters = { name, contactName };
  const initialSuppliers = await getSuppliers(initialFilters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Proveedores"
        description="Administre la información de sus proveedores de repuestos e insumos."
        actions={
          <Link href="/inventory/suppliers/new" passHref>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </Link>
        }
      />
      <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /> <p className="ml-4">Cargando proveedores...</p></div>}>
        <SupplierListClient initialSuppliers={initialSuppliers} initialFilters={initialFilters} />
      </Suspense>
    </div>
  );
}
