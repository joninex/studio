// src/app/(app)/orders/[id]/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderDetailClient } from "@/components/orders/OrderDetailClient";
import { getOrderById } from "@/lib/actions/order.actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { OrderForm } from "@/components/orders/OrderForm";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 0; // Revalidate on every request

export default async function OrderDetailPage({ 
  params,
  searchParams 
}: { 
  params: { id: string },
  searchParams?: { edit?: string }
}) {
  const orderId = params.id;
  const isEditMode = searchParams?.edit === 'true';

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? `Editando Orden ${order.orderNumber}` : `Detalle de Orden ${order.orderNumber}`}
        description={isEditMode ? "Modifique los detalles de la orden de servicio." : "Visualice todos los detalles de la orden de servicio."}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/orders">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado
              </Link>
            </Button>
            {!isEditMode && (
              <Button variant="outline" asChild>
                <Link href={`/orders/${orderId}?edit=true`}>
                  <Edit className="mr-2 h-4 w-4" /> Editar Orden
                </Link>
              </Button>
            )}
             {isEditMode && (
              <Button variant="outline" asChild>
                <Link href={`/orders/${orderId}`}>
                  <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                </Link>
              </Button>
            )}
          </div>
        }
      />
      <Suspense fallback={<div className="flex justify-center items-center h-96"><LoadingSpinner size={48} /><p className="ml-4">Cargando detalles...</p></div>}>
        {isEditMode ? (
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <OrderForm orderId={orderId} />
            </CardContent>
          </Card>
        ) : (
          <OrderDetailClient order={order} />
        )}
      </Suspense>
    </div>
  );
}

// Add Eye icon to imports in OrderDetailClient if needed, or lucide-react generally
// For PageHeader actions above
import { Eye } from "lucide-react";
