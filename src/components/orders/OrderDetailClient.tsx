// src/components/orders/OrderDetailClient.tsx
"use client";

import type { Order, User, Comment as OrderComment, OrderStatus, OrderPartItem, PaymentItem, Branch, Checklist } from "@/types";
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
import { ORDER_STATUSES, CHECKLIST_ITEMS } from "@/lib/constants";
import { AlertCircle, CalendarDays, DollarSign, FileText, Info, ListChecks, MessageSquare, Printer, User as UserIcon, Wrench, Package, CreditCard, Pencil, CheckCircle, Clock } from "lucide-react";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const validOrderStatusOptions = ORDER_STATUSES.filter(status => status !== "") as OrderStatus[];

interface OrderDetailClientProps {
  order: Order;
  branch: Branch | null;
}

export function OrderDetailClient({ order: initialOrder, branch }: OrderDetailClientProps) {
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
  
  const handleWhatsAppContact = () => {
    if (!order.clientPhone) {
        toast({ variant: "destructive", title: "Error", description: "El cliente no tiene un número de teléfono registrado."});
        return;
    }

    const cleanedPhone = order.clientPhone.replace(/[\s+()-]/g, '');
    
    const storeName = branch?.settings?.companyName || 'el taller'; 
    const userName = user?.name || 'un técnico';
    const estimatedTime = order.estimatedCompletionTime || 'el final del día';
    
    const message = `Hola ${order.clientName}, te contacto desde ${storeName}. Tu orden n° ${order.orderNumber} para el equipo ${order.deviceBrand} ${order.deviceModel} tiene una hora de finalización estimada para las ${estimatedTime}. Te avisaremos en cuanto esté lista. Saludos, ${userName}.`;
    
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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

  const relevantChecklistItems = CHECKLIST_ITEMS
    .map(item => ({
      label: item.label,
      value: order.checklist?.[item.id as keyof Checklist]
    }))
    .filter(item => item.value && (typeof item.value === 'string' ? item.value.trim() !== '' && item.value !== 'no' : false) || (typeof item.value === 'boolean' && item.value === true) || item.value === 'si');

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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserIcon/>Datos del Cliente</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
                        <p><strong>ID Cliente:</strong> {order.clientId || 'N/A'}</p>
                        <p><strong>Teléfono:</strong> {order.clientPhone || 'N/A'}</p>
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
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock/>Tiempos y Plazos</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p><strong>Finalización Estimada:</strong> {order.estimatedCompletionTime || 'No especificada'}</p>
                         <p><strong>Listo para Retiro:</strong> {order.readyForPickupDate ? format(parseISO(order.readyForPickupDate as string), "dd MMM yyyy", { locale: es }) : 'Pendiente'}</p>
                        <p><strong>Entregado:</strong> {order.deliveryDate ? format(parseISO(order.deliveryDate as string), "dd MMM yyyy", { locale: es }) : 'Pendiente'}</p>
                    </CardContent>
                </Card>
            </div>
            
            <Separator/>
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign/>Costos y Presupuesto</CardTitle></CardHeader>
                    <CardContent className="text-sm grid sm:grid-cols-3 gap-4">
                        <p><strong>Costo Repuestos:</strong> ${order.costSparePart.toFixed(2)}</p>
                        <p><strong>Costo Mano de Obra:</strong> ${order.costLabor.toFixed(2)}</p>
                        <p className="font-bold text-base"><strong>Total Presupuestado:</strong> ${totalCost.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ListChecks/>Checklist de Recepción</CardTitle></CardHeader>
                    <CardContent>
                        {relevantChecklistItems.length > 0 ? (
                            <ul className="list-disc list-inside columns-2 text-sm">
                                {relevantChecklistItems.map((item, index) => (
                                    <li key={index}>
                                        {item.label}: <strong className="uppercase">{typeof item.value === 'string' ? item.value : 'Sí'}</strong>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No se marcaron items relevantes en el checklist.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            </CardContent>
        </Card>

      <div className="grid md:grid-cols-2 gap-6 no-print">
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

      <div className="grid md:grid-cols-3 gap-6 no-print">
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
                    Actualizar
                </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare/>Comunicación</CardTitle></CardHeader>
                <CardContent>
                    <Button onClick={handleWhatsAppContact} disabled={!order.clientPhone} className="w-full">
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.61 15.31 3.44 16.74L2.01 21.99L7.47 20.59C8.83 21.36 10.38 21.81 12.04 21.81C17.5 21.81 21.95 17.36 21.95 11.9C21.95 6.45 17.5 2 12.04 2M12.04 3.63C16.56 3.63 20.32 7.39 20.32 11.91C20.32 16.43 16.56 20.19 12.04 20.19C10.56 20.19 9.15 19.81 7.94 19.11L7.54 18.89L4.41 19.71L5.26 16.67L5.03 16.27C4.24 14.93 3.76 13.45 3.76 11.91C3.76 7.39 7.49 3.63 12.04 3.63M17.06 14.24C16.88 14.73 15.76 15.33 15.24 15.48C14.73 15.63 14.29 15.72 13.66 15.54C12.87 15.31 11.75 14.88 10.52 13.73C9.03 12.33 8.03 10.63 7.82 10.15C7.61 9.66 8.04 9.27 8.23 9.08C8.38 8.94 8.56 8.76 8.78 8.76C9 8.76 9.21 8.85 9.39 9.12C9.57 9.39 9.99 10.29 10.08 10.47C10.17 10.65 10.12 10.83 9.94 11.01C9.76 11.19 9.63 11.33 9.49 11.5C9.36 11.64 9.22 11.8 9.09 11.93C8.97 12.06 8.82 12.21 9.04 12.59C9.27 12.97 9.88 13.73 10.7 14.5C11.66 15.41 12.39 15.75 12.72 15.89C13.05 16.03 13.27 15.99 13.46 15.8C13.64 15.62 14.28 14.91 14.46 14.64C14.64 14.37 14.82 14.33 15.04 14.37C15.27 14.42 16.32 14.94 16.54 15.08C16.77 15.21 16.95 15.26 17.02 15.35C17.09 15.44 17.09 15.83 17.06 14.24Z" /></svg>
                        Contactar por WhatsApp
                    </Button>
                </CardContent>
            </Card>

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
