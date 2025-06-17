// src/app/(app)/inventory/parts/[id]/edit/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { PartForm } from "@/components/inventory/PartForm";
import { getPartById } from "@/lib/actions/part.actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0; 

interface EditPartPageProps {
  params: { id: string };
}

export default async function EditPartPage({ params }: EditPartPageProps) {
  const partId = params.id;
  const part = await getPartById(partId);

  if (!part) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editando Repuesto: ${part.name}`}
        description="Modifique los detalles del repuesto."
        actions={
          <Link href="/inventory/parts" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Listado
            </Button>
          </Link>
        }
      />
      <PartForm partId={partId} initialData={part} />
    </div>
  );
}
