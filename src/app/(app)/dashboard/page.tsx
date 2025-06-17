// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { getOrders } from "@/lib/actions/order.actions";
import type { Order, OrderStatus } from "@/types"; 
import { BarChart, FileText, Users, Wrench, PackageCheck, AlertTriangle, ListFilter, FileClock, Construction, Truck } from "lucide-react"; 
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"; 

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


  const quickStats = [
    { title: "Órdenes Pendientes", value: pendingOrdersCount, icon: FileClock, color: "text-blue-500", bgColor: "bg-blue-100", description: "Requieren atención inicial o aprobación." },
    { title: "En Reparación / Proceso", value: inRepairOrdersCount, icon: Wrench, color: "text-yellow-500", bgColor: "bg-yellow-100", description: "En taller, espera de repuestos o QC." },
    { title: "Listos para Retirar", value: readyForPickupCount, icon: PackageCheck, color: "text-green-500", bgColor: "bg-green-100", description: "Finalizados, esperando al cliente." },
    { title: "Rechazados / Sin Solución", value: rejectedOrNoSolutionCount, icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-100", description: "Presupuestos no aprobados o sin reparación." },
  ];

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
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
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary" />Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md">
                <Image src="https://placehold.co/300x150.png" alt="Gráfico de Actividad" width={300} height={150} data-ai-hint="activity chart" className="opacity-50"/>
                <p className="text-muted-foreground mt-2">Próximamente: Gráficos de actividad.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
