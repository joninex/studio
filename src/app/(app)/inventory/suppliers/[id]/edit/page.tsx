// src/app/(app)/inventory/suppliers/[id]/edit/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { SupplierForm } from "@/components/inventory/SupplierForm";
import { getSupplierById } from "@/lib/actions/supplier.actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0; 

interface EditSupplierPageProps {
  params: { id: string };
}

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const supplierId = params.id;
  const supplier = await getSupplierById(supplierId);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editando Proveedor: ${supplier.name}`}
        description="Modifique los detalles del proveedor."
        actions={
          <Link href="/inventory/suppliers" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Listado
            </Button>
          </Link>
        }
      />
      <SupplierForm supplierId={supplierId} initialData={supplier} />
    </div>
  );
}
