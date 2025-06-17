// src/app/(app)/finance/income-report/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOrders } from "@/lib/actions/order.actions";
import type { Order } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { DollarSign, TrendingUp } from "lucide-react";

export const revalidate = 0; // Revalidate on every request

export default async function IncomeReportPage() {
  const allOrders: Order[] = await getOrders();

  const incomeGeneratingOrders = allOrders.filter(order => 
    order.status === "Entregado" && (order.costLabor > 0 || order.costSparePart > 0)
  );

  const totalIncome = incomeGeneratingOrders.reduce((sum, order) => {
    return sum + (order.costLabor || 0) + (order.costSparePart || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporte de Ingresos"
        description="Detalle de los ingresos generados por órdenes de servicio completadas."
      />

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Resumen de Ingresos Totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            ${totalIncome.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresos totales generados por {incomeGeneratingOrders.length} órdenes entregadas.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Detalle de Órdenes Generadoras de Ingreso
          </CardTitle>
          <CardDescription>
            Listado de órdenes marcadas como "Entregado" que han generado ingresos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomeGeneratingOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead className="text-right">Monto Ingresado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeGeneratingOrders.map((order) => {
                    const orderIncome = (order.costLabor || 0) + (order.costSparePart || 0);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.clientName} {order.clientLastName}</TableCell>
                        <TableCell>{order.deviceBrand} {order.deviceModel}</TableCell>
                        <TableCell>
                          {order.deliveryDate 
                            ? format(parseISO(order.deliveryDate as string), "dd MMM yyyy, HH:mm", { locale: es }) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">${orderIncome.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No se encontraron órdenes entregadas que hayan generado ingresos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
