// src/app/(app)/dashboard/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, ListChecks, Users, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import Image from "next/image";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  const dashboardCards = [
    {
      title: "Órdenes Activas",
      value: "12",
      icon: ListChecks,
      description: "Órdenes actualmente en proceso.",
      color: "text-primary", 
      bgColor: "bg-primary/10",
    },
    {
      title: "Clientes Atendidos Hoy",
      value: "5",
      icon: Users,
      description: "Clientes que recibieron servicio.",
      color: "text-green-600", 
      bgColor: "bg-green-600/10",
    },
    {
      title: "Ingresos Estimados (Mes)",
      value: "$2,500",
      icon: BarChart,
      description: "Proyección de ingresos del mes.",
      color: "text-purple-600", 
      bgColor: "bg-purple-600/10",
    },
    {
      title: "Alertas Pendientes",
      value: "2",
      icon: AlertTriangle,
      description: "Notificaciones que requieren atención.",
      color: "text-destructive", 
      bgColor: "bg-destructive/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <LoadingSpinner size={48} />
        <p className="text-muted-foreground mt-2">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${user?.name || "Usuario"}!`}
        description="Resumen general de la actividad de su taller."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${card.bgColor}`}>
                   <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{card.value}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Actividad Reciente (Próximamente)</CardTitle>
            <CardDescription>
              Un feed de las últimas acciones y actualizaciones en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center text-muted-foreground py-12">
             <Image src="https://placehold.co/300x200.png?text=Actividad+Reciente" alt="Actividad Reciente Placeholder" width={300} height={200} className="rounded-md" data-ai-hint="activity feed chart"/>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Rendimiento del Taller (Próximamente)</CardTitle>
            <CardDescription>
              Gráficos y métricas clave sobre el rendimiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center text-muted-foreground py-12">
            <Image src="https://placehold.co/300x200.png?text=Rendimiento+Gráfico" alt="Rendimiento Placeholder" width={300} height={200} className="rounded-md" data-ai-hint="performance graph chart"/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
