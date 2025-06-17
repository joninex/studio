// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { getOrders } from "@/lib/actions/order.actions";
import type { Order, OrderStatus } from "@/types";
import { BarChart, FileText, Users, Wrench, PackageCheck, AlertTriangle, FileClock, Construction, Truck, List, ArrowRight, AlertOctagon } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const DELAY_THRESHOLD_DAYS = 7; // Consider an order delayed if not updated in 7 days

export default function DashboardPage() {
  const { user } = useAuth();
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoadingStats(true);
      try {
        const fetchedOrders = await getOrders();
        setOrdersData(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders for dashboard:", error);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchDashboardData();
  }, []);

  const finalStatuses: OrderStatus[] = ["Entregado", "Presupuesto Rechazado", "Sin Reparación"];

  const pendingStatuses: OrderStatus[] = [
    "Recibido", "En Diagnóstico", "Presupuestado", "Presupuesto Aprobado"
  ];
  const pendingOrdersCount = ordersData.filter(
    (order) => pendingStatuses.includes(order.status)
  ).length;

  const inRepairStatuses: OrderStatus[] = [
    "En Espera de Repuestos", "En Reparación", "En Control de Calidad"
  ];
  const inRepairOrdersCount = ordersData.filter(
    (order) => inRepairStatuses.includes(order.status)
  ).length;

  const readyForPickupCount = ordersData.filter(
    (order) => order.status === "Listo para Entrega"
  ).length;

  const notCompletedOrRejectedStatuses: OrderStatus[] = ["Presupuesto Rechazado", "Sin Reparación"];
  const rejectedOrNoSolutionCount = ordersData.filter(
    (order) => notCompletedOrRejectedStatuses.includes(order.status)
  ).length;

  const delayedOrders = useMemo(() => {
    const now = new Date();
    return ordersData.filter(order =>
      !finalStatuses.includes(order.status) &&
      differenceInDays(now, new Date(order.updatedAt)) > DELAY_THRESHOLD_DAYS
    ).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()); // oldest delay first
  }, [ordersData]);

  const delayedOrdersCount = delayedOrders.length;
  const recentDelayedOrders = delayedOrders.slice(0, 5);


  const quickStats = [
    { title: "Órdenes Pendientes", value: pendingOrdersCount, icon: FileClock, color: "text-blue-500", bgColor: "bg-blue-100", description: "Requieren atención o aprobación." },
    { title: "En Reparación / Proceso", value: inRepairOrdersCount, icon: Wrench, color: "text-yellow-500", bgColor: "bg-yellow-100", description: "En taller, repuestos o QC." },
    { title: "Listos para Retirar", value: readyForPickupCount, icon: PackageCheck, color: "text-green-500", bgColor: "bg-green-100", description: "Finalizados, esperando cliente." },
    { title: "Demoradas (>7 días)", value: delayedOrdersCount, icon: AlertOctagon, color: "text-orange-500", bgColor: "bg-orange-100", description: "Requieren seguimiento urgente." },
  ];
  // Note: "Rechazados / Sin Solución" was removed from quickStats to make space for "Demoradas". It can be added back if layout supports 5, or if another is less critical.

  const recentActivityOrders = useMemo(() => {
    return [...ordersData]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 5);
  }, [ordersData]);

  const getStatusBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Presupuesto Aprobado":
      case "En Espera de Repuestos":
      case "En Reparación":
      case "Reparado":
      case "En Control de Calidad":
      case "Listo para Entrega":
        return "default";
      case "Entregado":
        return "secondary";
      case "Recibido":
      case "En Diagnóstico":
      case "Presupuestado":
        return "outline";
      case "Presupuesto Rechazado":
      case "Sin Reparación":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${user?.name || "Usuario"}`}
        description="Resumen general de la actividad del taller."
      />

      {isLoadingStats ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => (
            <Card key={stat.title} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <LoadingSpinner size={24} className="my-2"/>
                <p className="text-xs text-muted-foreground pt-1">Cargando...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => (
            <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground pt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/orders/new">
              <Button variant="outline" className="w-full justify-start">Nueva Orden de Servicio</Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline" className="w-full justify-start">Ver Todas las Órdenes</Button>
            </Link>
            {user?.role === 'admin' && (
               <Link href="/users">
                <Button variant="outline" className="w-full justify-start">Gestionar Usuarios</Button>
              </Link>
            )}
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start">Configuración de Tienda</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><List className="h-5 w-5 text-primary" />Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={`act-${i}`} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-grow space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            ) : recentActivityOrders.length > 0 ? (
              <div className="space-y-3">
                {recentActivityOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`} className="block hover:bg-muted/50 p-3 rounded-lg border transition-colors group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-primary">
                          Orden: {order.orderNumber}
                          {order.clientName && order.clientName !== 'N/D' && ` - ${order.clientName} ${order.clientLastName || ''}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Actualizado: {format(new Date(order.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs whitespace-nowrap">{order.status}</Badge>
                         <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary"/>
                      </div>
                    </div>
                  </Link>
                ))}
                 {ordersData.length > 5 && (
                    <div className="mt-4 text-center">
                        <Link href="/orders">
                            <Button variant="link" className="text-sm">Ver todas las órdenes</Button>
                        </Link>
                    </div>
                 )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-md">
                <List className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mt-2">No hay actividad reciente.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertOctagon className="h-5 w-5 text-orange-500" />Órdenes Demoradas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={`del-${i}`} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-grow space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-md" />
                  </div>
                ))}
              </div>
            ) : recentDelayedOrders.length > 0 ? (
              <div className="space-y-3">
                {recentDelayedOrders.map((order) => {
                  const daysDelayed = differenceInDays(new Date(), new Date(order.updatedAt));
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`} className="block hover:bg-muted/50 p-3 rounded-lg border border-orange-500/50 transition-colors group">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-primary">
                            Orden: {order.orderNumber}
                            {order.clientName && order.clientName !== 'N/D' && ` - ${order.clientName} ${order.clientLastName || ''}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Última actualiz.: {format(new Date(order.updatedAt), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs whitespace-nowrap">{order.status}</Badge>
                           <Badge variant="destructive" className="bg-orange-500 text-xs whitespace-nowrap">Demorada {daysDelayed} días</Badge>
                           <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary"/>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                 {delayedOrders.length > 5 && (
                    <div className="mt-4 text-center">
                        <Link href={`/orders?status_delayed=true`}> {/* This filter doesn't exist yet, but for future */}
                            <Button variant="link" className="text-sm text-orange-600">Ver todas las demoradas</Button>
                        </Link>
                    </div>
                 )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-md">
                <CheckCircle className="h-12 w-12 text-green-500 opacity-50" /> {/* Changed Icon */}
                <p className="text-muted-foreground mt-2">No hay órdenes demoradas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" />Rechazadas / Sin Solución</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoadingStats ? (
                <div className="text-center p-4"><LoadingSpinner /> <p className="text-muted-foreground">Cargando...</p></div>
             ) : rejectedOrNoSolutionCount > 0 ? (
                <p className="text-2xl font-bold">{rejectedOrNoSolutionCount} <span className="text-sm font-normal text-muted-foreground">órdenes</span></p>
             ) : (
                <p className="text-muted-foreground">No hay órdenes en estos estados.</p>
             )}
              <Link href={`/orders?status=Presupuesto Rechazado&status=Sin Reparación`}> {/* Placeholder for multi-status filter */}
                <Button variant="link" className="text-sm mt-2">Ver detalle</Button>
              </Link>
          </CardContent>
        </Card>
    </div>
  );
}

// Ensure CheckCircle is imported if it's new
import { CheckCircle } from "lucide-react";
