// src/app/(app)/clients/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/ClientForm";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Cliente"
        description="Complete los detalles para registrar un nuevo cliente."
      />
      <Card className="shadow-xl">
        <CardContent className="p-6">
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
