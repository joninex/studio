// src/app/(app)/finance/cashflow/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Info } from "lucide-react";
import { getOrders } from "@/lib/actions/order.actions";
import type { Order } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const revalidate = 0; // Revalidate on every request

export default async function CashflowPage() {
  const allOrders: Order[] = await getOrders();

  const incomeTransactions = allOrders
    .filter(order => order.status === "Entregado" && (order.costLabor > 0 || order.costSparePart > 0))
    .map(order => ({
      id: order.id!,
      date: order.deliveryDate || order.updatedAt,
      description: `Ingreso por Orden ${order.orderNumber} (${order.clientName} ${order.clientLastName} - ${order.deviceBrand} ${order.deviceModel})`,
      amount: (order.costLabor || 0) + (order.costSparePart || 0),
      type: "income" as "income" | "expense",
    }));

  // Placeholder for expenses - in a real app, this would come from another data source
  const expenseTransactions: Array<{id: string, date: string, description: string, amount: number, type: "income" | "expense"}> = [
    // { id: "exp1", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: "Compra de Repuestos Proveedor X", amount: -15000, type: "expense" },
    // { id: "exp2", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: "Pago Alquiler Local", amount: -50000, type: "expense" },
  ];

  const allTransactions = [...incomeTransactions, ...expenseTransactions].sort(
    (a, b) => parseISO(b.date as string).getTime() - parseISO(a.date as string).getTime()
  );

  const totalIncome = incomeTransactions.reduce((sum, tr) => sum + tr.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, tr) => sum + tr.amount, 0); // amount is negative
  const netCashflow = totalIncome + totalExpenses;


  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos de Caja"
        description="Registro de ingresos y egresos del taller."
      />
      
      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-amber-500" />Aviso Importante</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            Esta sección muestra actualmente solo los **ingresos** derivados de órdenes de servicio marcadas como "Entregado". 
            La funcionalidad completa para registrar **egresos** y gestionar un flujo de caja detallado (con saldos, etc.) está en desarrollo.
            </p>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Resumen de Flujo de Caja (Simplificado)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales (Órdenes)</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Egresos Totales (Próximamente)</p>
                <p className="text-2xl font-bold text-red-600">${Math.abs(totalExpenses).toFixed(2)}</p>
            </div>
             <div>
                <p className="text-sm text-muted-foreground">Flujo Neto (Simplificado)</p>
                <p className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    ${netCashflow.toFixed(2)}
                </p>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle>Últimos Movimientos Registrados (Ingresos de Órdenes)</CardTitle>
        </CardHeader>
        <CardContent>
            {allTransactions.length > 0 ? (
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {allTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                            <TableCell>
                                {transaction.date 
                                ? format(parseISO(transaction.date as string), "dd MMM yyyy, HH:mm", { locale: es }) 
                                : 'N/A'}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'expense' ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                 </div>
            ) : (
                 <p className="text-muted-foreground text-center py-8">No hay movimientos registrados.</p>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
