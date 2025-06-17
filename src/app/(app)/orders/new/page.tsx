// src/app/(app)/orders/new/page.tsx
import { OrderForm } from "@/components/orders/OrderForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva Orden de Servicio"
        description="Complete los detalles para registrar un nuevo equipo en el taller."
      />
      <Card className="shadow-xl">
        <CardContent className="p-6">
          <OrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
