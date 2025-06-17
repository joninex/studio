
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChartIcon, ListChecks, Users, AlertTriangle, Activity, TrendingUp, PackageCheck, Clock, Edit3, CheckCircle2, DollarSign, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { getOrders } from "@/lib/actions/order.actions";
import type { Order, OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format, isThisMonth, isToday, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";

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

export default async function DashboardPage() {
  const userName = "Admin"; // Placeholder, replace with actual user data logic
  const allOrders: Order[] = await getOrders(); // Fetch all orders for calculations

  // Calculate dynamic stats
  const activeStatuses: OrderStatus[] = [
    "Recibido", "En Diagnóstico", "Presupuestado", "Presupuesto Aprobado", 
    "En Espera de Repuestos", "En Reparación", "Reparado", 
    "En Control de Calidad", "Listo para Entrega"
  ];
  const activeOrdersCount = allOrders.filter(order => activeStatuses.includes(order.status)).length;

  const ordersCreatedToday = allOrders.filter(order => order.entryDate && isToday(parseISO(order.entryDate as string))).length;

  const incomeGeneratingStatuses: OrderStatus[] = [
    "Presupuesto Aprobado", "En Espera de Repuestos", "En Reparación", 
    "Reparado", "En Control de Calidad", "Listo para Entrega", "Entregado"
  ];
  const monthlyIncome = allOrders
    .filter(order => 
      order.entryDate && 
      isThisMonth(parseISO(order.entryDate as string)) && 
      incomeGeneratingStatuses.includes(order.status)
    )
    .reduce((sum, order) => sum + (order.costSparePart || 0) + (order.costLabor || 0), 0);

  const alertStatuses: OrderStatus[] = ["En Espera de Repuestos", "Listo para Entrega"];
  // More advanced: filter by age, e.g., ready for pickup > 7 days
  const ordersInAlert = allOrders.filter(order => alertStatuses.includes(order.status)).length;


  const dashboardStats = [
    { title: "Órdenes Activas", value: activeOrdersCount.toString(), icon: ListChecks, description: "Órdenes actualmente en proceso.", color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Órdenes Creadas Hoy", value: ordersCreatedToday.toString(), icon: CalendarPlus, description: "Nuevas órdenes registradas hoy.", color: "text-green-600", bgColor: "bg-green-600/10" },
    { title: "Ingresos del Mes", value: `$${monthlyIncome.toFixed(2)}`, icon: DollarSign, description: "Suma de costos (rep.+MO) de órdenes facturables del mes.", color: "text-purple-600", bgColor: "bg-purple-600/10" },
    { title: "Órdenes en Alerta", value: ordersInAlert.toString(), icon: AlertTriangle, description: "Órdenes esperando repuestos o listas para retirar.", color: "text-destructive", bgColor: "bg-destructive/10" },
  ];

  const recentOrders: Order[] = await getOrders({ limit: 5, sortBy: 'entryDate' });

  const ordersByStatusData: { name: string, count: number }[] = allOrders.reduce((acc, order) => {
    const statusName = order.status;
    const existingStatus = acc.find(item => item.name === statusName);
    if (existingStatus) {
      existingStatus.count++;
    } else {
      acc.push({ name: statusName, count: 1 });
    }
    return acc;
  }, [] as { name: string, count: number }[]);

  const recentActivityIcons: Record<OrderStatus | 'default', React.ElementType> = {
    Recibido: PackageCheck,
    "En Diagnóstico": Edit3,
    Presupuestado: Edit3,
    "Presupuesto Aprobado": CheckCircle2,
    "En Espera de Repuestos": Clock,
    "En Reparación": Clock,
    Reparado: CheckCircle2,
    "En Control de Calidad": CheckCircle2,
    "Listo para Entrega": PackageCheck,
    Entregado: CheckCircle2,
    "Presupuesto Rechazado": AlertTriangle,
    "Sin Reparación": AlertTriangle,
    default: Activity 
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${userName}!`}
        description="Resumen general de la actividad de su taller."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((card) => {
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
            <CardTitle className="flex items-center gap-2"><Activity className="text-primary"/>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas órdenes actualizadas o creadas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length > 0 ? (
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {recentOrders.map(order => {
                  const ActivityIcon = recentActivityIcons[order.status as OrderStatus] || recentActivityIcons.default;
                  return (
                  <li key={order.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-md transition-colors">
                    <ActivityIcon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-grow">
                      <Link href={`/orders/${order.id}`} className="font-medium text-primary hover:underline">
                        Orden {order.orderNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {order.clientName} {order.clientLastName} - {order.deviceBrand} {order.deviceModel}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(order.entryDate as string), "dd MMM, HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </li>
                )})}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay actividad reciente.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary"/>Rendimiento del Taller</CardTitle>
            <CardDescription>
              Distribución de órdenes de servicio por estado actual.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 h-[300px]">
            {ordersByStatusData.length > 0 ? (
              <OrderStatusChart data={ordersByStatusData} />
            ) : (
              <p className="text-muted-foreground text-center flex items-center justify-center h-full">No hay datos de órdenes para mostrar el gráfico.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

