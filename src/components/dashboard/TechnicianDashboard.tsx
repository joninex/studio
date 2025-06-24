// src/components/dashboard/TechnicianDashboard.tsx
"use client";

import type { Order, User, OrderStatus } from "@/types";
import { useMemo } from "react";
import { DashboardStatCard } from "./DashboardStatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Wrench, PackageSearch, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TechnicianDashboardProps {
    allOrders: Order[];
    currentUser: User;
}

export function TechnicianDashboard({ allOrders, currentUser }: TechnicianDashboardProps) {
    
    const technicianData = useMemo(() => {
        const inactiveStatuses: OrderStatus[] = ["Entregado", "Presupuesto Rechazado", "Sin Reparación"];
        const myOrders = allOrders.filter(o => o.assignedTechnicianId === currentUser.uid);
        const myActiveOrders = myOrders.filter(o => !inactiveStatuses.includes(o.status));
        const awaitingParts = myActiveOrders.filter(o => o.status === "En Espera de Repuestos");
        
        // Example: Completed last 7 days - more complex logic can be added
        const completedRecently = myOrders.filter(o => o.status === 'Entregado' || o.status === 'Reparado').length;

        return {
            stats: {
                active: myActiveOrders.length,
                awaitingParts: awaitingParts.length,
                completed: completedRecently,
            },
            activeOrders: myActiveOrders,
        };
    }, [allOrders, currentUser.uid]);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DashboardStatCard 
                    title="Mis Órdenes Activas"
                    value={technicianData.stats.active}
                    description="Órdenes asignadas y en proceso"
                    icon={Briefcase}
                />
                <DashboardStatCard 
                    title="Esperando Repuestos"
                    value={technicianData.stats.awaitingParts}
                    description="Órdenes detenidas por falta de stock"
                    icon={PackageSearch}
                    isWarning={technicianData.stats.awaitingParts > 0}
                />
                <DashboardStatCard 
                    title="Reparaciones Completadas"
                    value={technicianData.stats.completed}
                    description="Total de órdenes finalizadas"
                    icon={Wrench}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mis Tareas Pendientes</CardTitle>
                    <CardDescription>Listado de todas tus órdenes de reparación activas.</CardDescription>
                </CardHeader>
                <CardContent>
                    {technicianData.activeOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>N° Orden</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Equipo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha Ingreso</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {technicianData.activeOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                            <TableCell>{order.clientName} {order.clientLastName}</TableCell>
                                            <TableCell>{order.deviceBrand} {order.deviceModel}</TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'En Espera de Repuestos' ? "destructive" : "secondary"}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(order.entryDate), "dd MMM yyyy", { locale: es })}
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
                            <p>¡Buen trabajo! No tienes órdenes activas asignadas.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
