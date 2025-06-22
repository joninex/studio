// src/app/(app)/dashboard/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkOrderDashboard } from "@/components/dashboard/WorkOrderDashboard";
import { getOrders } from "@/lib/actions/order.actions";
import type { Order, OrderStatus } from "@/types";
import { differenceInDays, isToday, isThisMonth, parseISO } from 'date-fns';

export const revalidate = 0; // Revalidate on every request

export default async function DashboardPage() {
  const userName = "Admin"; // Placeholder, replace with actual user data logic
  const allOrders: Order[] = await getOrders();

  // 1. Calculate Active Orders
  const inactiveStatuses: OrderStatus[] = ["Entregado", "Presupuesto Rechazado", "Sin Reparación"];
  const activeOrdersCount = allOrders.filter(o => !inactiveStatuses.includes(o.status)).length;

  // 2. Calculate New Orders Today
  const newOrdersTodayCount = allOrders.filter(o => {
    try {
        return isToday(parseISO(o.entryDate as string));
    } catch {
        return false;
    }
  }).length;

  // 3. Calculate Monthly Revenue
  const revenueStatuses: OrderStatus[] = ["Reparado", "Listo para Entrega", "Entregado"];
  const monthlyRevenue = allOrders
    .filter(o => {
        try {
            return revenueStatuses.includes(o.status) && isThisMonth(parseISO(o.entryDate as string));
        } catch {
            return false;
        }
    })
    .reduce((sum, o) => sum + (o.costLabor || 0) + (o.costSparePart || 0), 0);

  // 4. Calculate Pending Alerts
  const pendingAlerts = allOrders.filter(order => {
    if (inactiveStatuses.includes(order.status)) return false; // Ignore finished orders

    if (order.status === "En Espera de Repuestos") return true;
    
    try {
        if (order.status === "Presupuestado" && differenceInDays(new Date(), parseISO(order.entryDate as string)) > 3) return true;
        if (order.status === "Listo para Entrega" && order.readyForPickupDate && differenceInDays(new Date(), parseISO(order.readyForPickupDate as string)) > 7) return true;
    } catch {
        return false;
    }

    return false;
  }).map(order => {
      let alertReason = order.status;
      try {
        if(order.status === "Listo para Entrega" && order.readyForPickupDate) {
            alertReason = `Listo hace ${differenceInDays(new Date(), parseISO(order.readyForPickupDate as string))} días`;
        } else if (order.status === "Presupuestado") {
            alertReason = "Esperando aprobación";
        } else if (order.status === "En Espera de Repuestos") {
            alertReason = "Esperando repuestos";
        }
      } catch {}
      
      return { ...order, alertReason };
  });

  // 5. Prepare Data for Status Chart
  const ordersByStatus = allOrders.reduce((acc, order) => {
    const status = order.status || "Sin Estado";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<OrderStatus | "Sin Estado", number>);

  const ordersByStatusForChart = Object.entries(ordersByStatus).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${userName}!`}
        description="Resumen general de la actividad de su taller."
      />
      <WorkOrderDashboard
        stats={{
          activeOrders: activeOrdersCount,
          newOrdersToday: newOrdersTodayCount,
          monthlyRevenue: monthlyRevenue,
          pendingAlertsCount: pendingAlerts.length,
        }}
        alertOrders={pendingAlerts}
        chartData={ordersByStatusForChart}
      />
    </div>
  );
}
