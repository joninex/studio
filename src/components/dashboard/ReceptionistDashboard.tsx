// src/components/dashboard/ReceptionistDashboard.tsx
"use client";

import type { Order } from "@/types";
import { useMemo } from "react";
import { DashboardStatCard } from "./DashboardStatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackageCheck, FileClock, Eye, UserCheck } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface ReceptionistDashboardProps {
    allOrders: Order[];
}

export function ReceptionistDashboard({ allOrders }: ReceptionistDashboardProps) {

    const receptionistData = useMemo(() => {
        const readyForPickupOrders = allOrders.filter(o => o.status === "Listo para Entrega");
        const pendingApprovalOrders = allOrders.filter(o => o.status === "Presupuestado");

        return {
            stats: {
                readyForPickup: readyForPickupOrders.length,
                pendingApproval: pendingApprovalOrders.length,
            },
            readyForPickupOrders,
            pendingApprovalOrders,
        };
    }, [allOrders]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                 <DashboardStatCard 
                    title="Listos para Retirar"
                    value={receptionistData.stats.readyForPickup}
                    description="Equipos esperando ser retirados por el cliente"
                    icon={PackageCheck}
                />
                 <Card>
                    <CardHeader>
                        <CardTitle>Equipos Listos para Retirar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {receptionistData.readyForPickupOrders.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Orden</TableHead><TableHead>Cliente</TableHead><TableHead>Días en espera</TableHead><TableHead className="text-right"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {receptionistData.readyForPickupOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                            <TableCell>{order.clientName}</TableCell>
                                            <TableCell>
                                                <Badge variant={differenceInDays(new Date(), parseISO(order.readyForPickupDate as string)) > 7 ? 'destructive' : 'default'}>
                                                  {differenceInDays(new Date(), parseISO(order.readyForPickupDate as string))} días
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right"><Button asChild variant="outline" size="sm"><Link href={`/orders/${order.id}`}>Ver</Link></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No hay equipos listos para retirar.</p>}
                    </CardContent>
                 </Card>
            </div>
             <div className="space-y-6">
                 <DashboardStatCard 
                    title="Esperando Aprobación"
                    value={receptionistData.stats.pendingApproval}
                    description="Presupuestos pendientes de aprobación del cliente"
                    icon={FileClock}
                    isWarning={receptionistData.stats.pendingApproval > 0}
                />
                 <Card>
                    <CardHeader>
                        <CardTitle>Órdenes Pendientes de Aprobación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {receptionistData.pendingApprovalOrders.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Orden</TableHead><TableHead>Cliente</TableHead><TableHead>Fecha Ingreso</TableHead><TableHead className="text-right"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {receptionistData.pendingApprovalOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                            <TableCell>{order.clientName}</TableCell>
                                            <TableCell>{format(new Date(order.entryDate), "dd MMM yyyy", { locale: es })}</TableCell>
                                             <TableCell className="text-right"><Button asChild variant="outline" size="sm"><Link href={`/orders/${order.id}`}>Ver</Link></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No hay presupuestos pendientes.</p>}
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
