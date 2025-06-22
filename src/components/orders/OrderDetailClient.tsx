// src/components/orders/OrderDetailClient.tsx
"use client";

import type { Order, User, Comment as OrderComment, OrderStatus, OrderPartItem, PaymentItem, Branch, Checklist, AuditLogEntry } from "@/types";
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
import { addOrderComment, updateOrderStatus, updateOrderConfirmations, updateOrderImei, logCustomerVoucherPrint } from "@/lib/actions/order.actions";
import { ORDER_STATUSES, CHECKLIST_ITEMS } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertCircle, CalendarDays, DollarSign, FileText, Info, ListChecks, MessageSquare, Printer, User as UserIcon, Wrench, Package, CreditCard, Pencil, CheckCircle, Clock, ShieldCheck, FileSignature, History } from "lucide-react";
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
  const [isTransitioning, startTransition] = useTransition();
  const [isPrinting, setIsPrinting] = useState(false);
  const [order, setOrder] = useState<Order>(initialOrder);
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus>(order?.status);
  const [newImei, setNewImei] = useState(order?.deviceIMEI || "");

  const handleStatusChange = async () => {
    if (!user || !newStatus || newStatus === order.status) return;
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus, user.name);
      if (result.success && result.order) {
        setOrder(result.order);
        toast({ title: "Éxito", description: "Estado de la orden actualizado." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleUpdateImei = async () => {
    if (!user || !newImei || newImei === order.deviceIMEI) return;
     if (newImei.length < 14 || newImei.length > 16) {
        toast({ variant: "destructive", title: "Error", description: "El IMEI/Serie debe tener entre 14 y 16 caracteres."});
        return;
    }
    startTransition(async () => {
        const result = await updateOrderImei(order.id, newImei, user.name);
        if (result.success && result.order) {
            setOrder(result.order);
            toast({ title: "Éxito", description: "IMEI/Serie actualizado."});
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    });
  };

  const handleConfirmationChange = async (confirmationType: 'intake' | 'pickup', isChecked: boolean) => {
    if (!user) return;
    startTransition(async () => {
        const result = await updateOrderConfirmations(order.id, confirmationType, isChecked, user.name);
        if (result.success && result.order) {
            setOrder(result.order);
            toast({ title: "Éxito", description: "Confirmación actualizada."});
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    });
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    startTransition(async () => {
        const result = await addOrderComment(order.id, newComment, user.name);
        if (result.success && result.comment) {
            setOrder(prevOrder => ({
                ...prevOrder,
                commentsHistory: [...prevOrder.commentsHistory, result.comment!],
                auditLog: result.order?.auditLog || prevOrder.auditLog,
            }));
            setNewComment("");
            toast({ title: "Éxito", description: "Comentario agregado."});
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    });
  };

  const handlePrintCustomerVoucher = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "Debe iniciar sesión." });
        return;
    }
    setIsPrinting(true);
    try {
        await logCustomerVoucherPrint(order.id, user.name);
        toast({ title: "Acción Registrada", description: "La impresión del comprobante de cliente ha sido registrada en la bitácora." });
        window.open(`/print/customer/${order.id}`, '_blank');
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo registrar la acción de impresión." });
        console.error("Failed to log customer voucher print:", error);
    } finally {
        setIsPrinting(false);
    }
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

  const getChecklistValueDisplay = (value: 'si' | 'no' | 'sc' | string | undefined) => {
    if (value === 'si') return <span className="font-bold text-green-600">SÍ</span>;
    if (value === 'no') return <span className="font-bold text-red-600">NO</span>;
    if (value === 'sc') return <span className="font-bold text-yellow-600">S/C</span>;
    if (value) return <span className="font-bold">{value}</span>;
    return 'N/A';
  }

  const checklistGroups = CHECKLIST_ITEMS.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {} as Record<string, typeof CHECKLIST_ITEMS>);

  const canPrintCustomerVoucher = ["Recibido", "En Reparación", "Listo para Entrega", "Entregado"].includes(order.status);


  return (
    <div className="space-y-6">
       <Alert className="no-print">
            <Printer className="h-4 w-4" />
            <AlertTitle>Documentación de la Orden</AlertTitle>
            <AlertDescription className="flex justify-between items-center flex-wrap gap-2">
                <span>Imprima los documentos necesarios para la firma del cliente.</span>
                 <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/print/${order.id}`} target="_blank">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Contrato de Ingreso
                        </Link>
                    </Button>
                    {canPrintCustomerVoucher && (
                         <Button variant="default" onClick={handlePrintCustomerVoucher} disabled={isPrinting}>
                            {isPrinting ? <LoadingSpinner size={16} className="mr-2"/> : <FileText className="mr-2 h-4 w-4" />}
                            Comprobante para Cliente
                        </Button>
                    )}
                 </div>
            </AlertDescription>
        </Alert>
       
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
                        <p><strong>IMEI/Serial:</strong> {order.deviceIMEI || 'No visible al ingreso'}</p>
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
                        <div className="space-y-3">
                            {Object.entries(checklistGroups).map(([groupName, items]) => (
                                <div key={groupName}>
                                <h4 className="font-semibold text-primary/90">{groupName}</h4>
                                <ul className="list-disc list-inside columns-2 text-sm text-muted-foreground">
                                    {items.map(item => (
                                        <li key={item.id}>
                                            {item.label}: {getChecklistValueDisplay(order.checklist[item.id as keyof Checklist])}
                                        </li>
                                    ))}
                                </ul>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            </CardContent>
        </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
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
                <Button onClick={handleStatusChange} disabled={isTransitioning || newStatus === order.status || !newStatus}>
                    {isTransitioning && <LoadingSpinner size={16} className="mr-2"/>}
                    Actualizar
                </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileSignature/>Confirmaciones Legales</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="intakeSigned" checked={order.intakeFormSigned} onCheckedChange={(checked) => handleConfirmationChange('intake', !!checked)} disabled={isTransitioning}/>
                        <label htmlFor="intakeSigned" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Comprobante de Ingreso firmado en físico
                        </label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="pickupSigned" checked={order.pickupFormSigned} onCheckedChange={(checked) => handleConfirmationChange('pickup', !!checked)} disabled={isTransitioning}/>
                        <label htmlFor="pickupSigned" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Comprobante de Retiro firmado en físico
                        </label>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Wrench/>Actualizar IMEI/Serie</CardTitle></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow">
                    <label htmlFor="imeiInput" className="text-sm font-medium">IMEI / Número de Serie</label>
                    <Input id="imeiInput" value={newImei} onChange={(e) => setNewImei(e.target.value)} placeholder="Completar IMEI/Serie"/>
                </div>
                <Button onClick={handleUpdateImei} disabled={isTransitioning || newImei === order.deviceIMEI || !newImei}>
                    {isTransitioning && <LoadingSpinner size={16} className="mr-2"/>}
                    Guardar
                </Button>
                </CardContent>
            </Card>
      </div>

       <div className="grid md:grid-cols-2 gap-6 no-print">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare/>Comentarios Internos</CardTitle></CardHeader>
                <CardContent>
                <div className="space-y-4 mb-4 max-h-48 overflow-y-auto">
                    {order.commentsHistory && order.commentsHistory.length > 0 ? order.commentsHistory.map((comment, index) => (
                    <div key={index} className="text-sm p-3 bg-muted rounded-md">
                        <p className="font-semibold">{comment.userName} <span className="text-xs text-muted-foreground">- {format(parseISO(comment.timestamp as string), "dd MMM yyyy, HH:mm", { locale: es })}</span></p>
                        <p>{comment.description}</p>
                    </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios.</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Textarea placeholder="Agregar comentario técnico..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                    <Button onClick={handleAddComment} disabled={isTransitioning || !newComment.trim()}>
                    {isTransitioning && <LoadingSpinner size={16} className="mr-2"/>}
                    Agregar Comentario
                    </Button>
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><History/>Bitácora de la Orden</CardTitle></CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                    {order.auditLog && order.auditLog.length > 0 ? (
                        <ul className="space-y-3">
                            {order.auditLog.map((log) => (
                                <li key={log.id} className="flex items-start text-sm">
                                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5 shrink-0"/>
                                    <div>
                                        <p className="text-muted-foreground">{log.description}</p>
                                        <p className="text-xs text-muted-foreground/70">
                                            Por <span className="font-semibold">{log.userName}</span> el {format(parseISO(log.timestamp as string), "dd MMM yyyy, HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay historial de auditoría.</p>
                    )}
                </CardContent>
            </Card>
      </div>

    </div>
  );
}
