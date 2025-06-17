// src/components/orders/OrderDetailClient.tsx
"use client";

import type { Order, User, Comment as OrderComment, OrderStatus, StoreSettings, Client, Checklist } from "@/types";
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
import { getClientById } from "@/lib/actions/client.actions"; 
import { CHECKLIST_ITEMS, ORDER_STATUSES } from "@/lib/constants";
import { AlertCircle, Bot, CalendarDays, DollarSign, Edit, FileText, Info, ListChecks, MessageSquare, Printer, User as UserIcon, Wrench, PackageCheck, Smartphone, LinkIcon, QrCode } from "lucide-react";
import { Input } from "../ui/input";
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
          lastUpdatedBy: user.uid, 
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

  const daysSinceReady = order.readyForPickupDate && order.status !== "Entregado" && order.status !== "Sin Reparación" && order.status !== "Presupuesto Rechazado"
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

  const getPrintTitle = (): string => {
    switch (order.status) {
      case "Recibido":
      case "En Diagnóstico":
        return `Orden de Ingreso N°: ${order.orderNumber}`;
      case "Presupuestado":
      case "Presupuesto Rechazado":
        return `Presupuesto N°: ${order.orderNumber}`;
      case "Reparado":
      case "En Control de Calidad":
      case "Listo para Entrega":
      case "Entregado":
        return `Comprobante de Entrega N°: ${order.orderNumber}`;
      case "Presupuesto Aprobado":
      case "En Espera de Repuestos":
      case "En Reparación":
         return `Orden de Servicio N°: ${order.orderNumber}`;
      default:
        return `Documento Orden N°: ${order.orderNumber}`;
    }
  };

  const isIngresoContext = ["Recibido", "En Diagnóstico"].includes(order.status);
  const isPresupuestoContext = ["Presupuestado", "Presupuesto Rechazado", "Presupuesto Aprobado"].includes(order.status);
  const isEntregaContext = ["Listo para Entrega", "Entregado"].includes(order.status);
  const isReparacionContext = ["En Reparación", "Reparado", "En Control de Calidad"].includes(order.status);

  const showChecklistForPrint = isIngresoContext || order.status === "Presupuestado";
  const showBudgetForPrint = (order.costSparePart > 0 || order.costLabor > 0) && (isPresupuestoContext || isReparacionContext || isEntregaContext);
  const showTechnicalCommentsForPrint = order.commentsHistory && order.commentsHistory.length > 0 && (isPresupuestoContext || isReparacionContext || isEntregaContext);
  const showWarrantyDetailsForPrint = order.hasWarranty;
  
  const showClientReceptionSignature = isIngresoContext && order.customerAccepted;
  const showTechnicianReceptionSignature = isIngresoContext;
  const showClientBudgetSignature = isPresupuestoContext && order.status === "Presupuestado";
  const showClientDeliverySignature = isEntregaContext;


  return (
    <div className="space-y-6">
      {/* ----- PRINT ONLY VIEW ----- */}
      <div className="print-only hidden print:block print-container-full-page">
        <div className="print-header-container mb-6 text-center">
            <div className="flex justify-between items-start">
                <div className="text-left">
                    {order.orderCompanyLogoUrl && (
                      <Image
                        src={order.orderCompanyLogoUrl}
                        alt={order.orderCompanyName || "Company Logo"}
                        width={120} // Adjusted size
                        height={45}  // Adjusted size
                        className="print-logo mb-2"
                        data-ai-hint="company logo"
                      />
                    )}
                    <p className="print-company-info text-xs font-semibold">{order.orderCompanyName}</p>
                    {order.orderCompanyAddress && <p className="print-company-info text-xs">{order.orderCompanyAddress}</p>}
                    {order.orderCompanyCuit && <p className="print-company-info text-xs">CUIT: {order.orderCompanyCuit}</p>}
                </div>
                <div className="text-right">
                    <h1 className="text-xl font-bold print-title mb-1">{getPrintTitle()}</h1>
                    <p className="print-company-info text-xs">Fecha Ingreso: {format(new Date(order.entryDate), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                    <p className="print-company-info text-xs">Estado Actual: {order.status}</p>
                     <Image 
                        src="https://placehold.co/80x80.png?text=QR" 
                        alt="QR Code" 
                        width={80} 
                        height={80} 
                        className="mt-2 ml-auto print-qr-code"
                        data-ai-hint="order QR code"
                     />
                </div>
            </div>
        </div>

        <div className="print-section card-print">
            <h3 className="print-section-title"><UserIcon className="inline-block mr-2 h-4 w-4"/>Datos del Cliente</h3>
            {isLoadingClient ? (
                <p className="text-sm">Cargando cliente...</p>
            ) : clientData ? (
              <div className="grid grid-cols-2 gap-x-4 text-sm">
                <p><strong>Nombre:</strong> {clientData.name} {clientData.lastName}</p>
                <p><strong>DNI:</strong> {clientData.dni}</p>
                <p><strong>Teléfono:</strong> {clientData.phone}</p>
                <p><strong>Email:</strong> {clientData.email || "No provisto"}</p>
                {clientData.address && <p className="col-span-2"><strong>Dirección:</strong> {clientData.address}</p>}
              </div>
            ) : (
              <p className="text-sm text-destructive">Cliente no encontrado (ID: {order.clientId}).</p>
            )}
        </div>

        <div className="print-section card-print">
            <h3 className="print-section-title"><Smartphone className="inline-block mr-2 h-4 w-4"/>Datos del Equipo</h3>
            <div className="grid grid-cols-2 gap-x-4 text-sm">
                <p><strong>Marca:</strong> {order.deviceBrand}</p>
                <p><strong>Modelo:</strong> {order.deviceModel}</p>
                <p><strong>IMEI/Serial:</strong> {order.deviceIMEI}</p>
                <p><strong>PIN/Patrón:</strong> {order.unlockPatternInfo} <span className="text-xs italic">(Información protegida para uso interno)</span></p>
                <p className="col-span-2"><strong>Falla Declarada:</strong> {order.declaredFault}</p>
                <p className="col-span-2"><strong>Daños Preexistentes/Observaciones de Ingreso:</strong> {order.damageRisk || "Sin observaciones específicas de daños."}</p>
            </div>
        </div>

        {showChecklistForPrint && (
            <div className="print-section card-print">
                <h3 className="print-section-title"><ListChecks className="inline-block mr-2 h-4 w-4"/>Checklist de Recepción</h3>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
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
        )}
        
        {showTechnicalCommentsForPrint && (
            <div className="print-section card-print">
                <h3 className="print-section-title"><MessageSquare className="inline-block mr-2 h-4 w-4"/>Diagnóstico / Historial Técnico</h3>
                 <div className="space-y-2 text-sm">
                    {order.commentsHistory.map((comment, index) => (
                    <div key={comment.id || index} className="print-comment-item p-2 border-b">
                        <p className="font-semibold">{comment.userName || `Técnico ID: ${comment.userId}`} <span className="text-xs text-muted-foreground">- {format(new Date(comment.timestamp), "dd/MM/yy HH:mm", { locale: es })}</span></p>
                        <p className="whitespace-pre-line">{comment.description}</p>
                    </div>
                    ))}
                </div>
            </div>
        )}

        {showBudgetForPrint && (
           <div className="print-section card-print">
            <h3 className="print-section-title"><DollarSign className="inline-block mr-2 h-4 w-4"/>Presupuesto</h3>
            <table className="w-full text-sm">
                <tbody>
                    <tr><td className="py-1">Costo Repuestos:</td><td className="text-right py-1">${order.costSparePart.toFixed(2)}</td></tr>
                    <tr><td className="py-1">Costo Mano de Obra:</td><td className="text-right py-1">${order.costLabor.toFixed(2)}</td></tr>
                    <tr className="font-bold border-t"><td className="py-1">Total Estimado:</td><td className="text-right py-1">${(order.costSparePart + order.costLabor).toFixed(2)}</td></tr>
                    {order.costPending > 0 && <tr className="italic"><td className="py-1">Monto Pendiente de Pago:</td><td className="text-right py-1">${order.costPending.toFixed(2)}</td></tr>}
                </tbody>
            </table>
           </div>
        )}
        
        {showWarrantyDetailsForPrint && (
            <div className="print-section card-print">
                <h3 className="print-section-title"><PackageCheck className="inline-block mr-2 h-4 w-4"/>Detalles de Garantía</h3>
                <div className="text-sm space-y-1">
                    <p><strong>Tipo de Garantía:</strong> {order.warrantyType === '30d' ? '30 Días' : order.warrantyType === '60d' ? '60 Días' : order.warrantyType === '90d' ? '90 Días' : order.warrantyType === 'custom' ? `Personalizada (${format(new Date(order.warrantyStartDate!), "dd/MM/yy", { locale: es })} - ${format(new Date(order.warrantyEndDate!), "dd/MM/yy", { locale: es })})` : 'N/A'}</p>
                    {order.warrantyStartDate && !['custom'].includes(order.warrantyType || "") && <p><strong>Periodo:</strong> {format(new Date(order.warrantyStartDate), "dd/MM/yyyy", { locale: es })} - {format(new Date(order.warrantyEndDate!), "dd/MM/yyyy", { locale: es })}</p>}
                    {order.warrantyCoveredItem && <p><strong>Pieza/Procedimiento Cubierto:</strong> {order.warrantyCoveredItem}</p>}
                    {order.warrantyNotes && <p><strong>Notas de Garantía:</strong> {order.warrantyNotes}</p>}
                </div>
            </div>
        )}

        <div className="print-signature-section-container mt-6 space-y-8">
            {showClientReceptionSignature && (
                 <div className="print-signature-area">
                    <p className="text-xs">El cliente declara conocer y aceptar los términos y condiciones del servicio, el descargo de responsabilidad por pérdida de datos y la política de privacidad detallados al pie de este documento, así como el estado de recepción del equipo.</p>
                    <div className="mt-10">
                        <p className="print-signature-line">Firma Cliente (Recepción):</p>
                        <p className="print-signature-clarification">Aclaración: {order.customerSignatureName || (clientData ? `${clientData.name} ${clientData.lastName}`: '____________________')}</p>
                        <p className="print-signature-clarification">DNI: {clientData?.dni || '____________________'}</p>
                    </div>
                </div>
            )}
            {showTechnicianReceptionSignature && (
                 <div className="print-signature-area">
                     <p className="text-xs">El técnico abajo firmante constata el estado de recepción del equipo y los detalles declarados por el cliente.</p>
                    <div className="mt-10">
                        <p className="print-signature-line">Firma Técnico (Recepción/Verificación):</p>
                        <p className="print-signature-clarification">Aclaración:</p>
                        <p className="print-signature-clarification">Legajo/ID Técnico:</p>
                    </div>
                </div>
            )}
            {showClientBudgetSignature && (
                <div className="print-signature-area">
                    <p className="text-xs">El cliente declara ACEPTAR / RECHAZAR (tachar lo que no corresponda) el presupuesto detallado y autoriza la reparación bajo las condiciones indicadas.</p>
                    <div className="mt-10">
                        <p className="print-signature-line">Firma Cliente (Presupuesto):</p>
                        <p className="print-signature-clarification">Aclaración:</p>
                        <p className="print-signature-clarification">DNI:</p>
                    </div>
                </div>
            )}
            {showClientDeliverySignature && (
                 <div className="print-signature-area">
                    <p className="text-xs">El cliente declara recibir el equipo reparado de conformidad y acepta las condiciones de garantía si aplicasen.</p>
                    <div className="mt-10">
                        <p className="print-signature-line">Firma Cliente (Entrega):</p>
                        <p className="print-signature-clarification">Aclaración:</p>
                        <p className="print-signature-clarification">DNI:</p>
                    </div>
                </div>
            )}
        </div>
        
        <div className="print-footer-container mt-8 pt-4 border-t">
            <h4 className="print-section-title text-xs mb-1">Términos y Condiciones Generales:</h4>
            <div className="text-xs space-y-1 print-terms">
                {order.orderSnapshottedDataLossDisclaimer && <p><strong>PÉRDIDA DE DATOS:</strong> {order.orderSnapshottedDataLossDisclaimer}</p>}
                {order.orderWarrantyConditions && <p><strong>CONDICIONES DE GARANTÍA:</strong> {order.orderWarrantyConditions}</p>}
                {order.orderPickupConditions && <p><strong>CONDICIONES DE RETIRO Y ABANDONO:</strong> {order.orderPickupConditions} {order.orderAbandonmentPolicyDays60 && `Equipos no retirados luego de ${order.orderAbandonmentPolicyDays60} días podrán ser declarados en abandono y el taller podrá disponer de los mismos según la ley vigente.`}</p>}
                {order.orderSnapshottedPrivacyPolicy && <p><strong>POLÍTICA DE PRIVACIDAD Y ACCESO AL DISPOSITIVO:</strong> {order.orderSnapshottedPrivacyPolicy}</p>}
                {order.orderCompanyContactDetails && <p className="whitespace-pre-line mt-2 text-center font-semibold"><strong>{order.orderCompanyName}</strong><br/>{order.orderCompanyContactDetails}</p>}
            </div>
        </div>
      </div>
      {/* ----- END PRINT ONLY VIEW ----- */}


      {/* ----- UI VIEW (NO-PRINT) ----- */}
      <Card className="no-print shadow-xl">
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 mb-1">
              <FileText className="h-6 w-6 text-primary" />
              Orden de Servicio: {order.orderNumber}
            </CardTitle>
            <CardDescription>
              Fecha de Ingreso: {format(new Date(order.entryDate), "dd MMM yyyy, HH:mm", { locale: es })}
            </CardDescription>
             <div className="mt-2 flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-3 py-1">{order.status}</Badge>
                {abandonmentWarning && (
                  <Badge variant="destructive" className="ml-2 text-sm px-3 py-1 animate-pulse">
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
          <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-muted/30">
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
            <Card className="bg-muted/30">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary"/>Datos del Equipo</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Marca:</strong> {order.deviceBrand}</p>
                <p><strong>Modelo:</strong> {order.deviceModel}</p>
                <p><strong>IMEI/Serial:</strong> {order.deviceIMEI}</p>
                <p><strong>Falla Declarada:</strong> {order.declaredFault}</p>
                <p><strong>Clave/Patrón:</strong> {order.unlockPatternInfo} <span className="text-xs italic">(Protegido)</span></p>
              </CardContent>
            </Card>
          </div>

          {(order.checklist && Object.keys(order.checklist).length > 0) && (
            <>
              <Separator/>
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>Checklist de Recepción</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  {CHECKLIST_ITEMS.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.label}:</span>
                      <span className={`font-medium ${order.checklist[item.id as keyof Checklist] === 'si' ? 'text-green-600' : 'text-red-600'}`}>
                        {order.checklist[item.id as keyof Checklist] === 'si' ? 'Sí' : 'No'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator/>
          <div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><AlertCircle className="h-5 w-5 text-primary"/>Riesgos y Condiciones</h3>
                  <p className="text-sm"><strong>Riesgo de Rotura (Daños Preexistentes):</strong> {order.damageRisk || "Ninguno especificado"}</p>
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
          </div>
          
          {(order.commentsHistory && order.commentsHistory.length > 0) && (
            <>
            <Separator />
            <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary"/>Historial Técnico / Diagnóstico</h3>
                 <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {order.commentsHistory.map((comment, index) => (
                    <div key={comment.id || index} className="text-sm p-3 bg-muted/30 rounded-md border">
                        <p className="font-semibold">{comment.userName || `Usuario ID: ${comment.userId}`} <span className="text-xs text-muted-foreground">- {format(new Date(comment.timestamp), "dd MMM yyyy, HH:mm", { locale: es })}</span></p>
                        <p>{comment.description}</p>
                    </div>
                    ))}
                </div>
            </div>
            </>
          )}

          {(order.costSparePart > 0 || order.costLabor > 0) && (
            <>
              <Separator/>
               <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/>Costos / Presupuesto</h3>
                    {!isEditingCosts && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingCosts(true)}><Edit className="mr-2 h-4 w-4"/>Editar Costos</Button>
                    )}
                </div>
                {isEditingCosts ? (
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-end p-4 border rounded-md bg-muted/20">
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
            </>
          )}
          
          {order.hasWarranty && (
             <>
                <Separator/>
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><PackageCheck className="h-5 w-5 text-primary"/>Detalles de Garantía</h3>
                    <div className="text-sm space-y-1">
                        <p><strong>Tipo de Garantía:</strong> {order.warrantyType === '30d' ? '30 Días' : order.warrantyType === '60d' ? '60 Días' : order.warrantyType === '90d' ? '90 Días' : order.warrantyType === 'custom' ? 'Personalizada' : 'N/A'}</p>
                        {order.warrantyStartDate && <p><strong>Inicio Garantía:</strong> {format(new Date(order.warrantyStartDate), "dd MMM yyyy", { locale: es })}</p>}
                        {order.warrantyEndDate && <p><strong>Fin Garantía:</strong> {format(new Date(order.warrantyEndDate), "dd MMM yyyy", { locale: es })}</p>}
                        {order.warrantyCoveredItem && <p><strong>Pieza/Procedimiento Cubierto:</strong> {order.warrantyCoveredItem}</p>}
                        {order.warrantyNotes && <p><strong>Notas de Garantía:</strong> {order.warrantyNotes}</p>}
                    </div>
                </div>
             </>
          )}


          <Separator/>
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary"/>Seguimiento y Fechas</h3>
            <div className="text-sm space-y-1">
                <p><strong>Última Actualización:</strong> {format(new Date(order.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })} {user?.uid === order.lastUpdatedBy ? `por ${user.name}` : ``}</p>
                {order.readyForPickupDate && <p><strong>Listo para Retirar:</strong> {format(new Date(order.readyForPickupDate), "dd MMM yyyy, HH:mm", { locale: es })}</p>}
                {order.deliveryDate && <p><strong>Entregado:</strong> {format(new Date(order.deliveryDate), "dd MMM yyyy, HH:mm", { locale: es })}</p>}
            </div>
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
                {validOrderStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
