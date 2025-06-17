// src/app/(app)/orders/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderListClient } from "@/components/orders/OrderListClient";
import { getOrders } from "@/lib/actions/order.actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export const revalidate = 0; // Revalidate on every request for dynamic data

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const client = typeof searchParams?.client === 'string' ? searchParams.client : undefined;
  const orderNumber = typeof searchParams?.orderNumber === 'string' ? searchParams.orderNumber : undefined;
  const imei = typeof searchParams?.imei === 'string' ? searchParams.imei : undefined;
  const status = typeof searchParams?.status === 'string' ? searchParams.status : undefined;
  
  // Initial data fetch on the server
  const initialOrders = await getOrders({ client, orderNumber, imei, status });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de Servicio"
        description="Listado de todas las órdenes de reparación registradas."
        actions={
          <Link href="/orders/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Orden
            </Button>
          </Link>
        }
      />
      <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner size={48} /> <p className="ml-4">Cargando órdenes...</p></div>}>
        <OrderListClient initialOrders={initialOrders} initialFilters={{client, orderNumber, imei, status}} />
      </Suspense>
    </div>
  );
}
