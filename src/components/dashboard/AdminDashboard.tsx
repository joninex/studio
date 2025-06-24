// src/components/dashboard/AdminDashboard.tsx
"use client";

import type { Order, OrderStatus, User } from "@/types";
import { useMemo } from "react";
import { differenceInDays, isThisMonth, isToday, parseISO } from "date-fns";
import Link from "next/link";

import { DashboardStatCard } from "./DashboardStatCard";
import { OrderStatusChart } from "./OrderStatusChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Users, BarChartIcon, AlertTriangle, Eye, ServerCrash } from "lucide-react";

interface AdminDashboardProps {
    allOrders: Order[];
    allUsers: User[];
}

export function AdminDashboard({ allOrders, allUsers }: AdminDashboardProps) {

  const processedData = useMemo(() => {
    if (!allOrders) return { stats: { activeOrders: 0, newOrdersToday: 0, monthlyRevenue: 0, pendingAlertsCount: 0 }, alertOrders: [], chartData: [] };

    const inactiveStatuses: OrderStatus[] = ["Entregado", "Presupuesto Rechazado", "Sin Reparación"];
    const activeOrdersCount = allOrders.filter(o => !inactiveStatuses.includes(o.status)).length;
    
    const newOrdersTodayCount = allOrders.filter(o => {
        try { return isToday(parseISO(o.entryDate as string)); } catch { return false; }
    }).length;
    
    const revenueStatuses: OrderStatus[] = ["Reparado", "Listo para Entrega", "Entregado"];
    const monthlyRevenue = allOrders
      .filter(o => {
          try { return revenueStatuses.includes(o.status) && isThisMonth(parseISO(o.entryDate as string)); } catch { return false; }
      })
      .reduce((sum, o) => sum + (o.costLabor || 0) + (o.costSparePart || 0), 0);

    const alertOrders = allOrders.filter(order => {
      if (inactiveStatuses.includes(order.status)) return false;
      if (order.status === "En Espera de Repuestos") return true;
      try {
        if (order.status === "Presupuestado" && differenceInDays(new Date(), parseISO(order.entryDate as string)) > 3) return true;
        if (order.status === "Listo para Entrega" && order.readyForPickupDate && differenceInDays(new Date(), parseISO(order.readyForPickupDate as string)) > 7) return true;
      } catch { return false; }
      return false;
    }).map(order => {
        let alertReason = order.status;
        try {
          if (order.status === "Listo para Entrega" && order.readyForPickupDate) {
              alertReason = `Listo hace ${differenceInDays(new Date(), parseISO(order.readyForPickupDate as string))} días`;
          } else if (order.status === "Presupuestado") {
              alertReason = "Esperando aprobación";
          } else if (order.status === "En Espera de Repuestos") {
              alertReason = "Esperando repuestos";
          }
        } catch {}
        return { ...order, alertReason };
    });

    const ordersByStatus = allOrders.reduce((acc, order) => {
      const status = order.status || "Sin Estado";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus | "Sin Estado", number>);

    const chartData = Object.entries(ordersByStatus).map(([name, count]) => ({ name, count }));

    return {
        stats: {
          activeOrders: activeOrdersCount,
          newOrdersToday: newOrdersTodayCount,
          monthlyRevenue: monthlyRevenue,
          pendingAlertsCount: alertOrders.length,
        },
        alertOrders,
        chartData
    };

  }, [allOrders]);
  
  if (!allOrders) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <ServerCrash className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground mt-4 font-semibold">No se pudieron cargar los datos del dashboard.</p>
            <p className="text-sm text-muted-foreground">Intente recargar la página.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard 
            title="Órdenes Activas" 
            value={processedData.stats.activeOrders}
            description="Órdenes actualmente en proceso"
            icon={ListChecks}
        />
        <DashboardStatCard 
            title="Ingresos Hoy" 
            value={`+${processedData.stats.newOrdersToday}`}
            description="Nuevas órdenes registradas hoy"
            icon={Users}
        />
         <DashboardStatCard 
            title="Ingresos (Mes)" 
            value={`$${processedData.stats.monthlyRevenue.toFixed(2)}`}
            description="Basado en órdenes finalizadas"
            icon={BarChartIcon}
        />
        <DashboardStatCard 
            title="Alertas Pendientes" 
            value={processedData.stats.pendingAlertsCount}
            description="Órdenes que requieren acción"
            icon={AlertTriangle}
            isWarning
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Órdenes con Alertas</CardTitle>
            <CardDescription>
              Listado de órdenes que requieren una acción inmediata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processedData.alertOrders.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Equipo</TableHead>
                            <TableHead>Razón de Alerta</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {processedData.alertOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>
                                <div className="font-medium">{order.clientName} {order.clientLastName}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    #{order.orderNumber}
                                </div>
                                </TableCell>
                                <TableCell>{order.deviceBrand} {order.deviceModel}</TableCell>
                                <TableCell>
                                    <Badge variant="destructive">{order.alertReason}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="icon" title="Ver Orden">
                                        <Link href={`/orders/${order.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>¡Excelente! No hay órdenes con alertas pendientes.</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribución de Órdenes</CardTitle>
            <CardDescription>
              Cantidad de órdenes de servicio por estado actual.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <OrderStatusChart data={processedData.chartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
