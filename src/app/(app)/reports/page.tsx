
// src/app/(app)/reports/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOrders } from "@/lib/actions/order.actions";
import type { Order, OrderStatus } from "@/types";
import { BarChartBig, Briefcase, DollarSign, PackageSearch, BarChartHorizontalBig, Clock4, Info } from "lucide-react";

export const revalidate = 0; // Revalidate on every request

interface OrderStatusCount {
  status: OrderStatus | string;
  count: number;
}

export default async function ReportsPage() {
  const allOrders: Order[] = await getOrders();

  const ordersByStatus: OrderStatusCount[] = allOrders.reduce((acc, order) => {
    const existingStatus = acc.find(item => item.status === order.status);
    if (existingStatus) {
      existingStatus.count++;
    } else {
      acc.push({ status: order.status, count: 1 });
    }
    return acc;
  }, [] as OrderStatusCount[]).sort((a,b) => b.count - a.count); // Sort by count descending

  const placeholderReports = [
    { 
      title: "Rendimiento por Técnico", 
      description: "Análisis del número de órdenes completadas, tiempos promedio y eficiencia por cada técnico.",
      icon: Briefcase 
    },
    { 
      title: "Análisis de Rentabilidad", 
      description: "Rentabilidad por tipo de reparación, marca de dispositivo o período de tiempo.",
      icon: DollarSign
    },
    { 
      title: "Uso y Rotación de Repuestos", 
      description: "Reportes sobre los repuestos más utilizados, stock actual vs. demanda y costos asociados.",
      icon: PackageSearch
    },
    { 
      title: "Tiempos Promedio de Reparación", 
      description: "Duración promedio de las reparaciones por estado, tipo de dispositivo o técnico.",
      icon: Clock4
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Reportes"
        description="Visualice análisis y métricas clave de su taller."
      />

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartHorizontalBig className="h-6 w-6 text-primary" />
            Conteo de Órdenes por Estado Actual
          </CardTitle>
          <CardDescription>
            Distribución de todas las órdenes de servicio según su estado actual en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersByStatus.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado de la Orden</TableHead>
                    <TableHead className="text-right">Cantidad de Órdenes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersByStatus.map((item) => (
                    <TableRow key={item.status}>
                      <TableCell className="font-medium">{item.status}</TableCell>
                      <TableCell className="text-right font-semibold">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay órdenes para mostrar en el reporte.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {placeholderReports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title} className="shadow-lg opacity-70 hover:opacity-100 transition-opacity">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary/80" />
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center text-center py-8">
                  <Info className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Funcionalidad en desarrollo.</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
       <Card className="shadow-xl mt-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-amber-500" />Nota Adicional</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            La implementación completa de reportes detallados y personalizados es un proceso iterativo. Seguiremos añadiendo más capacidades de análisis en futuras actualizaciones.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
