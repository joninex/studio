// src/app/(app)/clients/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
// import { ClientForm } from "@/components/clients/ClientForm"; // To be created

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Cliente"
        description="Complete los detalles para registrar un nuevo cliente."
      />
      <Card className="shadow-xl">
        <CardContent className="p-6">
          {/* <ClientForm /> */}
          <div className="text-center py-10 text-muted-foreground">
            <p>Formulario de creación de cliente en desarrollo.</p>
            <p>Aquí podrá ingresar los datos del nuevo cliente.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
