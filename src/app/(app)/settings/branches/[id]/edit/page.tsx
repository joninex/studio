// src/app/(app)/settings/branches/[id]/edit/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { BranchForm } from "@/components/settings/BranchForm";
import { getBranchById } from "@/lib/actions/branch.actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export const revalidate = 0; 

interface EditBranchPageProps {
  params: { id: string };
}

async function EditFormLoader({ branchId }: { branchId: string }) {
    const branch = await getBranchById(branchId);
    if (!branch) {
      notFound();
    }
    return <BranchForm branchId={branchId} initialData={branch} />;
}

export default async function EditBranchPage({ params }: EditBranchPageProps) {
  const branchId = params.id;
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editando Sucursal`}
        description="Modifique los detalles de la sucursal."
        actions={
          <Link href="/settings/branches" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Listado
            </Button>
          </Link>
        }
      />
      <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /><p className="ml-2">Cargando datos...</p></div>}>
        <EditFormLoader branchId={branchId} />
      </Suspense>
    </div>
  );
}
