// src/components/orders/OrderDetailClient.tsx
"use client";

import type { Order, User, Comment as OrderComment, OrderStatus } from "@/types";
import { useState, useTransition } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
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
import { AlertCircle, CalendarDays, DollarSign, FileText, Info, ListChecks, MessageSquare, Printer, User as UserIcon, Wrench } from "lucide-react";
import { LoadingSpinner } from "../shared/LoadingSpinner";

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
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);

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

  const daysSinceReady = order.readyForPickupDate
    ? differenceInDays(new Date(), parseISO(order.readyForPickupDate))
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Orden de Servicio: {order.orderNumber}
          </CardTitle>
          <CardDescription>
            Fecha de Ingreso: {format(parseISO(order.entryDate), "dd MMM yyyy, HH:mm", { locale: es })}
          </CardDescription>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{order.status}</Badge>
            {daysSinceReady !== null && daysSinceReady > 7 && (
              <Badge variant="destructive" className="ml-2">
                <AlertCircle className="mr-1 h-4 w-4" /> {daysSinceReady} días esperando retiro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserIcon/>Datos del Cliente</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>ID:</strong> {order.clientId}</p>
                {/* We'd fetch client details here in a real app */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserIcon/>Datos del Equipo</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Marca:</strong> {order.deviceBrand}</p>
                <p><strong>Modelo:</strong> {order.deviceModel}</p>
                <p><strong>IMEI/Serial:</strong> {order.deviceIMEI}</p>
                <p><strong>Falla Declarada:</strong> {order.declaredFault}</p>
              </CardContent>
            </Card>
          </div>
          <Separator/>
          <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign/>Costos</CardTitle></CardHeader>
              <CardContent className="text-sm grid sm:grid-cols-3 gap-4">
                  <p><strong>Repuesto:</strong> ${order.costSparePart.toFixed(2)}</p>
                  <p><strong>Mano de Obra:</strong> ${order.costLabor.toFixed(2)}</p>
                  <p className="font-bold"><strong>Total:</strong> ${(order.costSparePart + order.costLabor).toFixed(2)}</p>
              </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Wrench/>Actualizar Estado</CardTitle></CardHeader>
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

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare/>Comentarios</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            {order.commentsHistory.map((comment, index) => (
              <div key={index} className="text-sm p-3 bg-muted rounded-md">
                <p className="font-semibold">{comment.userId} <span className="text-xs text-muted-foreground">- {format(parseISO(comment.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}</span></p>
                <p>{comment.description}</p>
              </div>
            ))}
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
  );
}
