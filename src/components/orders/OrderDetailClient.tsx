// src/components/orders/OrderDetailClient.tsx
"use client";

import type { Order, User, Comment as OrderComment, OrderStatus, StoreSettings, Client } from "@/types";
import { useState, useTransition, ChangeEvent, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { addOrderComment, updateOrderStatus, updateOrderCosts } from "@/lib/actions/order.actions";
import { getClientById } from "@/lib/actions/client.actions"; // Import new action
import { CHECKLIST_ITEMS, ORDER_STATUSES } from "@/lib/constants";
import { AlertCircle, Bot, CalendarDays, DollarSign, Edit, FileText, Info, ListChecks, MessageSquare, Printer, User as UserIcon, Wrench, PackageCheck, Smartphone, LinkIcon } from "lucide-react";
import { Input } from "../ui/input";
import { LoadingSpinner } from "../shared/LoadingSpinner";


interface OrderDetailClientProps {
  order: Order;
}

export function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);


  const [editableCosts, setEditableCosts] = useState({
    costSparePart: order.costSparePart,
    costLabor: order.costLabor,
    costPending: order.costPending,
  });
  const [isEditingCosts, setIsEditingCosts] = useState(false);

  useEffect(() => {
    async function fetchClientDetails() {
      if (order.clientId) {
        setIsLoadingClient(true);
        try {
          const client = await getClientById(order.clientId);
          setClientData(client);
        } catch (error) {
          console.error("Failed to fetch client details:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos del cliente." });
          setClientData(null);
        } finally {
          setIsLoadingClient(false);
        }
      } else {
        setIsLoadingClient(false);
        setClientData(null);
      }
    }
    fetchClientDetails();
  }, [order.clientId, toast]);


  const handleStatusChange = async () => {
    if (!user || !newStatus || newStatus === order.status) return;
    startTransition(async () => {
      const result = await updateOrderStatus(order.id!, newStatus, user.uid);
      if (result.success && result.order) {
        setOrder(result.order);
        toast({ title: "Éxito", description: "Estado de la orden actualizado." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleCostChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableCosts(prev => ({...prev, [name]: parseFloat(value) || 0}));
  };

  const handleSaveCosts = async () => {
    if(!user) return;
    startTransition(async () => {
      const result = await updateOrderCosts(order.id!, editableCosts, user.uid);
       if (result.success && result.order) {
        setOrder(result.order);
        setIsEditingCosts(false);
        toast({ title: "Éxito", description: "Costos actualizados." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    startTransition(async () => {
      const result = await addOrderComment(order.id!, newComment.trim(), {uid: user.uid, name: user.name});
      if (result.success && result.comment) {
        setOrder(prevOrder => ({
          ...prevOrder,
          commentsHistory: [...prevOrder.commentsHistory, result.comment as OrderComment],
          updatedAt: new Date().toISOString(), 
          lastUpdatedBy: user.uid, // Should be user.name or a way to get it
        }));
        setNewComment("");
        toast({ title: "Éxito", description: "Comentario agregado." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const daysSinceReady = order.readyForPickupDate && order.status !== "entregado" && order.status !== "abandonado"
    ? differenceInDays(new Date(), new Date(order.readyForPickupDate))
    : null;

  let abandonmentWarning = "";
  if (daysSinceReady !== null && order.orderAbandonmentPolicyDays60) {
    const abandonmentPolicyDays30 = (order.orderAbandonmentPolicyDays60 || 60) / 2; 
    if (daysSinceReady >= (order.orderAbandonmentPolicyDays60 || 60)) abandonmentWarning = `Equipo considerado abandonado (${order.orderAbandonmentPolicyDays60 || 60}+ días).`;
    else if (daysSinceReady >= abandonmentPolicyDays30) abandonmentWarning = `Equipo en riesgo de abandono (${Math.round(abandonmentPolicyDays30)}+ días).`;
  }

  const getStatusBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "en reparación":
      case "listo para retirar":
        return "default";
      case "entregado":
        return "secondary";
      case "en diagnóstico":
      case "esperando pieza":
      case "ingreso":
        return "outline";
      case "abandonado":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="print-only text-center mb-6 hidden print:block">
        {order.orderCompanyLogoUrl && (
          <Image
            src={order.orderCompanyLogoUrl}
            alt={order.orderCompanyName || "Company Logo"}
            width={150}
            height={56}
            className="mx-auto mb-4"
            data-ai-hint="company logo"
          />
        )}
        <h1 className="text-2xl font-bold">{order.orderCompanyName || "Orden de Servicio"} N°: {order.orderNumber}</h1>
        {order.orderCompanyAddress && <p className="text-sm">{order.orderCompanyAddress}</p>}
        {order.orderCompanyCuit && <p className="text-sm">CUIT: {order.orderCompanyCuit}</p>}
      </div>
      <Card className="print-container shadow-xl">
        <CardHeader className="flex flex-row justify-between items-start no-print">
          <div>
            <CardTitle className="flex items-center gap-2 mb-1">
              <FileText className="h-6 w-6 text-primary" />
              Orden de Servicio: {order.orderNumber}
            </CardTitle>
            <CardDescription>
              Fecha de Ingreso: {format(new Date(order.entryDate), "dd MMM yyyy, HH:mm", { locale: es })}
            </CardDescription>
             <div className="mt-2 flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1 badge-print">{order.status}</Badge>
                {abandonmentWarning && (
                  <Badge variant="destructive" className="ml-2 text-sm px-3 py-1 animate-pulse badge-print">
                    <AlertCircle className="mr-1 h-4 w-4" /> {abandonmentWarning}
                  </Badge>
                )}
                {order.previousOrderId && (
                   <Link href={`/orders/${order.previousOrderId}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                     <LinkIcon className="h-4 w-4"/> Ver Orden Anterior ({order.previousOrderId})
                   </Link>
                )}
              </div>
          </div>
          <Button onClick={handlePrint} variant="outline" className="no-print"><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
        </CardHeader>
        <div className="hidden print:block mb-4 p-6 border-b">
            <p><strong>Fecha de Ingreso:</strong> {format(new Date(order.entryDate), "dd MMMM yyyy, HH:mm", { locale: es })}</p>
            <p><strong>Estado Actual:</strong> <span className="font-semibold">{order.status}</span></p>
             {abandonmentWarning && (
                <p className="font-bold text-red-600 mt-1">ALERTA: {abandonmentWarning}</p>
            )}
            {order.previousOrderId && (
                <p><strong>Orden Anterior Vinculada:</strong> {order.previousOrderId}</p>
            )}
        </div>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-muted/30 card-print">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserIcon className="h-5 w-5 text-primary"/>Datos del Cliente</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                {isLoadingClient ? (
                    <div className="flex items-center gap-2"><LoadingSpinner size={16}/> Cargando cliente...</div>
                ) : clientData ? (
                  <>
                    <p><strong>Nombre:</strong> {clientData.name} {clientData.lastName}</p>
                    <p><strong>DNI:</strong> {clientData.dni}</p>
                    <p><strong>Teléfono:</strong> {clientData.phone}</p>
                    <p><strong>Email:</strong> {clientData.email || "No provisto"}</p>
                    {clientData.address && <p><strong>Dirección:</strong> {clientData.address}</p>}
                    {clientData.notes && <p><strong>Notas Cliente:</strong> {clientData.notes}</p>}
                  </>
                ) : (
                  <p className="text-destructive">Cliente no encontrado (ID: {order.clientId}).</p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-muted/30 card-print">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary"/>Datos del Equipo</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Marca:</strong> {order.deviceBrand}</p>
                <p><strong>Modelo:</strong> {order.deviceModel}</p>
                <p><strong>IMEI:</strong> {order.deviceIMEI}</p>
                <p><strong>Falla Declarada:</strong> {order.declaredFault}</p>
                <p><strong>Clave/Patrón:</strong> {order.unlockPatternInfo}</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="card-print">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>Checklist de Recepción</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              {CHECKLIST_ITEMS.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.label}:</span>
                  <span className={`font-medium ${order.checklist[item.id as keyof Checklist] === 'si' ? 'text-green-600 print:text-black' : 'text-red-600 print:text-black'}`}>
                    {order.checklist[item.id as keyof Checklist] === 'si' ? 'Sí' : 'No'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6 card-print">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2"><AlertCircle className="h-5 w-5 text-primary"/>Riesgos y Condiciones</h3>
                <p className="text-sm"><strong>Riesgo de Rotura:</strong> {order.damageRisk || "Ninguno especificado"}</p>
                <ul className="text-sm list-disc list-inside pl-1">
                    {order.pantalla_parcial && <li>Pantalla con daño parcial</li>}
                    {order.equipo_sin_acceso && <li>Equipo sin clave o que no enciende</li>}
                    {order.perdida_informacion && <li>Riesgo de pérdida de información</li>}
                    {!(order.pantalla_parcial || order.equipo_sin_acceso || order.perdida_informacion) && <li>Ninguna condición específica marcada.</li>}
                </ul>
            </div>
             <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Info className="h-5 w-5 text-primary"/>Otros Detalles</h3>
                <p className="text-sm"><strong>Clasificación (Para Stock):</strong> {order.classification || "No clasificado"}</p>
                <p className="text-sm"><strong>Observaciones Generales:</strong> {order.observations || "Sin observaciones"}</p>
                <p className="text-sm"><strong>Aceptado por:</strong> {order.customerSignatureName} (Aceptado: {order.customerAccepted ? "Sí" : "No"})</p>
                <p className="text-sm"><strong>Sucursal:</strong> {order.branchInfo}</p>
             </div>
          </div>

          <Separator />

           <div className="card-print">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/>Costos</h3>
                {!isEditingCosts && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingCosts(true)} className="no-print"><Edit className="mr-2 h-4 w-4"/>Editar Costos</Button>
                )}
            </div>
            {isEditingCosts ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end p-4 border rounded-md bg-muted/20 no-print">
                    <div className="space-y-1">
                        <label htmlFor="costSparePartEdit" className="text-xs font-medium">Repuesto ($)</label>
                        <Input id="costSparePartEdit" name="costSparePart" type="number" value={editableCosts.costSparePart} onChange={handleCostChange} className="h-9"/>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="costLaborEdit" className="text-xs font-medium">Mano Obra ($)</label>
                        <Input id="costLaborEdit" name="costLabor" type="number" value={editableCosts.costLabor} onChange={handleCostChange} className="h-9"/>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="costPendingEdit" className="text-xs font-medium">Pendiente ($)</label>
                        <Input id="costPendingEdit" name="costPending" type="number" value={editableCosts.costPending} onChange={handleCostChange} className="h-9"/>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveCosts} disabled={isPending} className="w-full">
                           {isPending && <LoadingSpinner size={16} className="mr-2"/>} Guardar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsEditingCosts(false); setEditableCosts({costSparePart: order.costSparePart, costLabor: order.costLabor, costPending: order.costPending});}} className="w-full">Cancelar</Button>
                    </div>
                </div>
            ) : (
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <p><strong>Repuesto:</strong> ${order.costSparePart.toFixed(2)}</p>
                    <p><strong>Mano de Obra:</strong> ${order.costLabor.toFixed(2)}</p>
                    <p><strong>Pendiente:</strong> ${order.costPending.toFixed(2)}</p>
                    <p className="sm:col-span-3 font-bold text-base"><strong>Total Estimado:</strong> ${(order.costSparePart + order.costLabor).toFixed(2)}</p>
                </div>
            )}
           </div>

          <Separator />

          <div className="card-print">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><PackageCheck className="h-5 w-5 text-primary"/>Seguimiento y Fechas</h3>
            <div className="text-sm space-y-1">
                <p><strong>Última Actualización:</strong> {format(new Date(order.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })} {user?.uid === order.lastUpdatedBy ? `por ${user.name}` : `por Usuario ID: ${order.lastUpdatedBy}`}</p>
                {order.readyForPickupDate && <p><strong>Listo para Retirar:</strong> {format(new Date(order.readyForPickupDate), "dd MMM yyyy, HH:mm", { locale: es })}</p>}
                {order.deliveryDate && <p><strong>Entregado:</strong> {format(new Date(order.deliveryDate), "dd MMM yyyy, HH:mm", { locale: es })}</p>}
            </div>
          </div>
          <div className="hidden print:block mt-8 pt-4 border-t">
            <p className="text-sm"><strong>Firma del Cliente Aceptando Condiciones:</strong> _________________________</p>
            <p className="text-sm mt-1"><strong>Aclaración:</strong> {order.customerSignatureName || clientData?.name + ' ' + clientData?.lastName}</p>
            { (
                <div className="text-xs mt-4 space-y-1">
                    {order.orderWarrantyConditions && <p><strong>CONDICIONES DE GARANTÍA:</strong> {order.orderWarrantyConditions}</p>}
                    {order.orderPickupConditions && <p><strong>CONDICIONES DE RETIRO:</strong> {order.orderPickupConditions} {order.orderAbandonmentPolicyDays60 && `Equipos no retirados luego de ${order.orderAbandonmentPolicyDays60} días podrán ser declarados en abandono.`}</p>}
                    {order.orderCompanyContactDetails && <p className="whitespace-pre-line mt-2"><strong>CONTACTO:</strong><br/>{order.orderCompanyContactDetails}</p>}
                </div>
            )}
          </div>

        </CardContent>
      </Card>

      <Card className="shadow-xl no-print">
        <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary"/>Actualizar Estado</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-grow">
            <label htmlFor="statusSelect" className="text-sm font-medium">Nuevo Estado</label>
            <Select value={newStatus || ""} onValueChange={(value: OrderStatus) => setNewStatus(value)}>
              <SelectTrigger id="statusSelect"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.filter(opt => opt !== "").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleStatusChange} disabled={isPending || newStatus === order.status || !newStatus} className="w-full sm:w-auto">
            {isPending && <LoadingSpinner size={16} className="mr-2"/>}
            Actualizar Estado
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-xl no-print">
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary"/>Comentarios Técnicos</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
            {order.commentsHistory.length > 0 ? order.commentsHistory.map((comment, index) => (
              <div key={comment.id || index} className="text-sm p-3 bg-muted/30 rounded-md border">
                <p className="font-semibold">{comment.userName || `Usuario ID: ${comment.userId}`} <span className="text-xs text-muted-foreground">- {format(new Date(comment.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}</span></p>
                <p>{comment.description}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Sin comentarios técnicos.</p>}
          </div>
          <div className="space-y-2">
            <Textarea placeholder="Agregar comentario técnico..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <Button onClick={handleAddComment} disabled={isPending || !newComment.trim()} className="w-full sm:w-auto">
              {isPending && <LoadingSpinner size={16} className="mr-2"/>}
              Agregar Comentario
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
