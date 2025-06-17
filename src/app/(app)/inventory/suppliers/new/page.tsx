// src/app/(app)/inventory/suppliers/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { SupplierForm } from "@/components/inventory/SupplierForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Proveedor"
        description="Complete los detalles para registrar un nuevo proveedor."
        actions={
          <Link href="/inventory/suppliers" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Listado
            </Button>
          </Link>
        }
      />
      <SupplierForm /> 
    </div>
  );
}
