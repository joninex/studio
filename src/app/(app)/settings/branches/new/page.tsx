// src/app/(app)/settings/branches/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { BranchForm } from "@/components/settings/BranchForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewBranchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva Sucursal"
        description="Complete los detalles para registrar una nueva tienda o sucursal."
        actions={
          <Link href="/settings/branches" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Listado
            </Button>
          </Link>
        }
      />
      <BranchForm /> 
    </div>
  );
}
