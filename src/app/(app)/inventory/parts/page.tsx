// src/app/(app)/inventory/parts/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { PartListClient } from "@/components/inventory/PartListClient";
import { getParts } from "@/lib/actions/part.actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export const revalidate = 0; // Revalidate on every request for dynamic data

export default async function PartsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const name = typeof searchParams?.name === 'string' ? searchParams.name : undefined;
  const sku = typeof searchParams?.sku === 'string' ? searchParams.sku : undefined;
  const category = typeof searchParams?.category === 'string' ? searchParams.category : undefined;
  
  const initialFilters = { name, sku, category };
  const initialParts = await getParts(initialFilters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Repuestos"
        description="Administre el inventario de repuestos y componentes."
        actions={
          <Link href="/inventory/parts/new" passHref>
            <Button>
              <PackagePlus className="mr-2 h-4 w-4" />
              Nuevo Repuesto
            </Button>
          </Link>
        }
      />
      <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /> <p className="ml-4">Cargando repuestos...</p></div>}>
        <PartListClient initialParts={initialParts} initialFilters={initialFilters} />
      </Suspense>
    </div>
  );
}
