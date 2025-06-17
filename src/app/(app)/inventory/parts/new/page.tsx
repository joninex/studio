// src/app/(app)/inventory/parts/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { PartForm } from "@/components/inventory/PartForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPartPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Repuesto"
        description="Complete los detalles para agregar un nuevo repuesto al inventario."
        actions={
          <Link href="/inventory/parts" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Listado
            </Button>
          </Link>
        }
      />
      <PartForm /> 
    </div>
  );
}
