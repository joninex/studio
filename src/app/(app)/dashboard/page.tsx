// src/app/(app)/dashboard/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { BarChart, FileText, Users, Wrench } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const { user } = useAuth();

  const quickStats = [
    { title: "Órdenes Activas", value: "12", icon: FileText, color: "text-blue-500", bgColor: "bg-blue-100" },
    { title: "Equipos Reparados (Mes)", value: "34", icon: Wrench, color: "text-green-500", bgColor: "bg-green-100" },
    { title: "Pendientes de Retiro", value: "5", icon: Users, color: "text-orange-500", bgColor: "bg-orange-100" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${user?.name || "Usuario"}`}
        description="Resumen general de la actividad del taller."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground pt-1">Actualizado recientemente</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/orders/new" passHref>
              <Button variant="outline" className="w-full justify-start">Nueva Orden de Servicio</Button>
            </Link>
            <Link href="/orders" passHref>
              <Button variant="outline" className="w-full justify-start">Ver Todas las Órdenes</Button>
            </Link>
            {user?.role === 'admin' && (
               <Link href="/users" passHref>
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
            {/* Placeholder for activity feed or chart */}
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md">
                <Image src="https://placehold.co/300x150.png?text=Gráfico+de+Actividad" alt="Gráfico de Actividad" width={300} height={150} data-ai-hint="activity chart" className="opacity-50"/>
                <p className="text-muted-foreground mt-2">Próximamente: Gráficos de actividad.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
