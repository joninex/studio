// src/components/orders/OrderDetailClient.tsx
"use client";

import type { Order, User, Comment as OrderComment, OrderStatus, OrderPartItem, PaymentItem } from "@/types";
import { useState, useTransition, useRef, useEffect } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { addOrderComment, updateOrderStatus } from "@/lib/actions/order.actions";
import { ORDER_STATUSES } from "@/lib/constants";
import { AlertCircle, CalendarDays, DollarSign, FileText, Info, ListChecks, MessageSquare, Printer, User as UserIcon, Wrench, Package, CreditCard, Pencil, CheckCircle } from "lucide-react";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const validOrderStatusOptions = ORDER_STATUSES.filter(status => status !== "") as OrderStatus[];

interface OrderDetailClientProps {
  order: Order;
}

export function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus>(order?.status);
  
  const handleStatusChange = async () => {
    if (!user || !newStatus || newStatus === order.status) return;
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus, user.uid);
      if (result.success && result.order) {
        setOrder(result.order);
        toast({ title: "Éxito", description: "Estado de la orden actualizado." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    startTransition(async () => {
        const result = await addOrderComment(order.id, newComment, user.uid);
        if (result.success && result.comment) {
            setOrder(prevOrder => ({
                ...prevOrder,
                commentsHistory: [...prevOrder.commentsHistory, result.comment!],
            }));
            setNewComment("");
            toast({ title: "Éxito", description: "Comentario agregado."});
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    });
  };
  
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
        <LoadingSpinner size={48} />
        <p className="text-muted-foreground mt-4 font-semibold">Cargando orden...</p>
      </div>
    );
  }

  const daysSinceReady = order.readyForPickupDate
    ? differenceInDays(new Date(), parseISO(order.readyForPickupDate as string))
    : null;

  const totalCost = (order.costLabor || 0) + (order.costSparePart || 0);
  
  return (
    <div className="space-y-6">
       <div className="flex justify-end no-print">
            <Button asChild variant="outline">
                <Link href={`/print/${order.id}`} target="_blank">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir / Guardar PDF
                </Link>
            </Button>
       </div>
       
       {/* Main content remains visible on the screen */}
        <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Orden de Servicio: {order.orderNumber}
                    </CardTitle>
                    <CardDescription>
                        Fecha de Ingreso: {format(parseISO(order.entryDate as string), "dd MMM yyyy, HH:mm", { locale: es })}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{order.status}</Badge>
                    {daysSinceReady !== null && daysSinceReady > 7 && (
                    <Badge variant="destructive" className="ml-2">
                        <AlertCircle className="mr-1 h-4 w-4" /> {daysSinceReady} días esperando retiro
                    </Badge>
                    )}
                </div>
            </div>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserIcon/>Datos del Cliente</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
                        <p><strong>ID Cliente:</strong> {order.clientId || 'N/A'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench/>Datos del Equipo</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p><strong>Marca:</strong> {order.deviceBrand || 'N/A'}</p>
                        <p><strong>Modelo:</strong> {order.deviceModel || 'N/A'}</p>
                        <p><strong>IMEI/Serial:</strong> {order.deviceIMEI || 'N/A'}</p>
                        <p><strong>Falla Declarada:</strong> {order.declaredFault || 'N/A'}</p>
                        <p><strong>Riesgos/Daños:</strong> {order.damageRisk || "Ninguno reportado."}</p>
                    </CardContent>
                </Card>
            </div>
            <Separator/>
            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign/>Costos y Presupuesto</CardTitle></CardHeader>
                <CardContent className="text-sm grid sm:grid-cols-3 gap-4">
                    <p><strong>Costo Repuestos:</strong> ${order.costSparePart.toFixed(2)}</p>
                    <p><strong>Costo Mano de Obra:</strong> ${order.costLabor.toFixed(2)}</p>
                    <p className="font-bold text-base"><strong>Total Presupuestado:</strong> ${totalCost.toFixed(2)}</p>
                </CardContent>
            </Card>
            </CardContent>
        </Card>

      <div className="grid md:grid-cols-2 gap-6 no-print">
        {/* Parts Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Package/>Piezas Utilizadas</CardTitle>
                <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4"/>Agregar Pieza</Button>
            </CardHeader>
            <CardContent>
                {order.partsUsed && order.partsUsed.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Cant.</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.partsUsed.map((part) => (
                                <TableRow key={part.partId}>
                                    <TableCell className="font-medium">{part.partName}</TableCell>
                                    <TableCell>{part.quantity}</TableCell>
                                    <TableCell className="text-right">${part.unitPrice.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No se han registrado piezas.</p>
                )}
            </CardContent>
        </Card>

        {/* Payments Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><CreditCard/>Historial de Pagos</CardTitle>
                <Button variant="outline" size="sm"><DollarSign className="mr-2 h-4 w-4"/>Registrar Pago</Button>
            </CardHeader>
            <CardContent>
                {order.paymentHistory && order.paymentHistory.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Método</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.paymentHistory.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>{format(parseISO(payment.date as string), "dd MMM yyyy", { locale: es })}</TableCell>
                                    <TableCell className="capitalize">{payment.method}</TableCell>
                                    <TableCell className="text-right font-semibold">${(payment.amount).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No se han registrado pagos.</p>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 no-print">
            {/* Status Update Card */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle/>Actualizar Estado</CardTitle></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow">
                    <label htmlFor="statusSelect" className="text-sm font-medium">Nuevo Estado</label>
                    <Select value={newStatus || ""} onValueChange={(value: OrderStatus) => setNewStatus(value)}>
                    <SelectTrigger id="statusSelect"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                    <SelectContent>
                        {validOrderStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleStatusChange} disabled={isPending || newStatus === order.status || !newStatus}>
                    {isPending && <LoadingSpinner size={16} className="mr-2"/>}
                    Actualizar Estado
                </Button>
                </CardContent>
            </Card>

            {/* Comments Card */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare/>Comentarios Internos</CardTitle></CardHeader>
                <CardContent>
                <div className="space-y-4 mb-4 max-h-48 overflow-y-auto">
                    {order.commentsHistory && order.commentsHistory.length > 0 ? order.commentsHistory.map((comment, index) => (
                    <div key={index} className="text-sm p-3 bg-muted rounded-md">
                        <p className="font-semibold">{comment.userId} <span className="text-xs text-muted-foreground">- {format(parseISO(comment.timestamp as string), "dd MMM yyyy, HH:mm", { locale: es })}</span></p>
                        <p>{comment.description}</p>
                    </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios.</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Textarea placeholder="Agregar comentario técnico..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                    <Button onClick={handleAddComment} disabled={isPending || !newComment.trim()}>
                    {isPending && <LoadingSpinner size={16} className="mr-2"/>}
                    Agregar Comentario
                    </Button>
                </div>
                </CardContent>
            </Card>
      </div>
    </div>
  );
}
