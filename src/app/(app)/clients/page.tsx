// src/app/(app)/clients/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
// Potentially Button and Link for "New Client" in the future
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { PlusCircle } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Clientes"
        description="Administre la información de sus clientes."
        // actions={
        //   <Link href="/clients/new" passHref>
        //     <Button>
        //       <PlusCircle className="mr-2 h-4 w-4" />
        //       Nuevo Cliente
        //     </Button>
        //   </Link>
        // }
      />
      {/* Client list or management components will go here in the future */}
      <div className="text-center py-10 text-muted-foreground">
        <p>Funcionalidad de gestión de clientes en desarrollo.</p>
        <p>Aquí podrá ver, crear y editar la información de sus clientes.</p>
      </div>
    </div>
  );
}
