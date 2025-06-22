// src/components/dashboard/WorkOrderDashboard.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChartIcon,
  ListChecks,
  Users,
  AlertTriangle,
  Eye,
} from "lucide-react"
import Link from "next/link";
import { OrderStatusChart } from "./OrderStatusChart";
import type { Order } from "@/types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface DashboardStats {
    activeOrders: number;
    newOrdersToday: number;
    monthlyRevenue: number;
    pendingAlertsCount: number;
}

interface AlertOrder extends Order {
    alertReason: string;
}

interface WorkOrderDashboardProps {
    stats: DashboardStats;
    alertOrders: AlertOrder[];
    chartData: { name: string; count: number }[];
}

export function WorkOrderDashboard({ stats, alertOrders, chartData }: WorkOrderDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Activas</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              Órdenes actualmente en proceso
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newOrdersToday}</div>
            <p className="text-xs text-muted-foreground">
              Nuevas órdenes registradas hoy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Basado en órdenes finalizadas este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.pendingAlertsCount}</div>
            <p className="text-xs text-muted-foreground">
              Órdenes que requieren acción
            </p>
          </CardContent>
        </Card>
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
            {alertOrders.length > 0 ? (
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
                        {alertOrders.map((order) => (
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
             <OrderStatusChart data={chartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
