
// src/components/orders/OrderDetailClient.tsx
"use client";

import type { Order, User, Comment as OrderComment, OrderStatus, StoreSettings, Client, Checklist, OrderPartItem, PaymentItem, PaymentMethod } from "@/types";
import { useState, useTransition, ChangeEvent, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { addOrderComment, updateOrderStatus, updateOrderCosts } from "@/lib/actions/order.actions";
import { getClientById } from "@/lib/actions/client.actions"; 
import { CHECKLIST_ITEMS, ORDER_STATUSES, SALE_CON_HUELLA_OPTIONS, DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { AlertCircle, Bot, CalendarDays, DollarSign, Edit, FileText, Info, ListChecks, MessageSquare, Printer, User as UserIcon, Wrench, PackageCheck, Smartphone, LinkIcon, QrCode, GripVertical, FileLock2, LockKeyhole, ClockIcon, Cog, CreditCard, PlusCircle } from "lucide-react";
import { Input } from "../ui/input";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const validOrderStatusOptions = ORDER_STATUSES.filter(status => status !== "") as OrderStatus[];

interface OrderDetailClientProps {
  order: Order;
}

const renderChecklistItemValueForPrint = (itemKey: keyof Checklist, value: any) => {
  const itemConfig = CHECKLIST_ITEMS.find(ci => ci.id === itemKey);
  if (itemConfig?.type === 'boolean') {
    return value === 'si' ? 'Sí' : (value === 'no' ? 'No' : 'N/A');
  }
  if (itemConfig?.type === 'enum_saleConHuella') {
    const option = SALE_CON_HUELLA_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : (value || 'N/A');
  }
  return value || 'N/A';
};


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
        const result = await addOrderComment(order.id!, newComment, { uid: user.uid, name: user.name });
        if (result.success && result.comment) {
            setOrder(prevOrder => ({
                ...prevOrder,
                commentsHistory: [...prevOrder.commentsHistory, result.comment!],
                updatedAt: new Date().toISOString(),
                lastUpdatedBy: user.uid,
            }));
            setNewComment("");
            toast({ title: "Éxito", description: "Comentario agregado."});
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const daysSinceReady = order.readyForPickupDate && order.status !== "Entregado" && order.status !== "Sin Reparación" && order.status !== "Presupuesto Rechazado"
    ? differenceInDays(new Date(), parseISO(order.readyForPickupDate as string))
    : null;
  
  let abandonmentWarning = "";
  if (daysSinceReady !== null && order.orderSnapshottedAbandonmentPolicyText) { 
    const abandonmentPolicyDaysTotal = DEFAULT_STORE_SETTINGS.abandonmentPolicyDays60 || 60; 
    const abandonmentPolicyFirstWarningDays = DEFAULT_STORE_SETTINGS.abandonmentPolicyDays30 || (abandonmentPolicyDaysTotal / 2);
    
    if (daysSinceReady >= abandonmentPolicyDaysTotal) {
      abandonmentWarning = `Equipo considerado abandonado (${abandonmentPolicyDaysTotal}+ días).`;
    } else if (daysSinceReady >= abandonmentPolicyFirstWarningDays) {
      abandonmentWarning = `Equipo en riesgo de abandono (${Math.round(abandonmentPolicyFirstWarningDays)}+ días).`;
    }
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
        return `Comprobante de Ingreso N°: ${order.orderNumber}`;
      case "Presupuestado":
      case "Presupuesto Rechazado":
      case "Presupuesto Aprobado":
        return `Presupuesto N°: ${order.orderNumber}`;
      case "Listo para Entrega":
      case "Entregado":
        return `Comprobante de Entrega N°: ${order.orderNumber}`;
      case "En Espera de Repuestos":
      case "En Reparación":
      case "Reparado":
      case "En Control de Calidad":
         return `Orden de Trabajo N°: ${order.orderNumber}`; 
      default:
        return `Documento Orden N°: ${order.orderNumber}`;
    }
  };

  const isIngresoContext = ["Recibido", "En Diagnóstico"].includes(order.status);
  const isPresupuestoContext = ["Presupuestado", "Presupuesto Rechazado", "Presupuesto Aprobado"].includes(order.status);
  const isEntregaContext = ["Listo para Entrega", "Entregado"].includes(order.status);
  const isReparacionContext = ["En Reparación", "Reparado", "En Control de Calidad", "En Espera de Repuestos"].includes(order.status);

  const showChecklistForPrint = isIngresoContext || order.status === "Presupuestado" || isReparacionContext;
  const showBudgetForPrint = (order.costSparePart > 0 || order.costLabor > 0) && (isPresupuestoContext || isReparacionContext || isEntregaContext || order.status === "Presupuestado");
  const showTechnicalCommentsForPrint = order.commentsHistory && order.commentsHistory.length > 0 && (isPresupuestoContext || isReparacionContext || isEntregaContext);
  const showWarrantyDetailsForPrint = order.hasWarranty && order.warrantyStartDate;
  
  const showClientReceptionSignature = isIngresoContext && order.customerAccepted;
  const showTechnicianReceptionSignature = isIngresoContext; 
  const showClientBudgetSignature = isPresupuestoContext && (order.status === "Presupuestado" || order.status === "Presupuesto Aprobado" || order.status === "Presupuesto Rechazado");
  const showClientDeliverySignature = isEntregaContext;


  return (
    <div className="space-y-6">
      {/* ----- PRINT ONLY VIEW ----- */}
      <div className="print-only hidden print:block print-container-full-page">
        {/* Hoja 1 y 2 (Contenido existente) */}
        {/* Header */}
        <div className="print-header-container mb-4">
            <div className="flex justify-between items-start">
                <div className="text-left">
                    {order.orderCompanyLogoUrl && !order.orderCompanyLogoUrl.includes('placehold.co') ? (
                      <Image
                        src={order.orderCompanyLogoUrl}
                        alt={order.orderCompanyName || "Company Logo"}
                        width={140} 
                        height={60}
                        className="print-logo mb-2 object-contain"
                        data-ai-hint="company logo"
                      />
                    ) : order.orderCompanyLogoUrl && order.orderCompanyLogoUrl.includes('placehold.co') ? (
                         <Image
                            src={order.orderCompanyLogoUrl}
                            alt="Placeholder Logo"
                            width={140}
                            height={60}
                            className="print-logo mb-2 object-contain"
                            data-ai-hint="company logo placeholder"
                         />
                    ) : null}
                    <p className="print-company-info text-xs font-semibold">{order.orderCompanyName}</p>
                    {order.orderCompanyAddress && <p className="print-company-info text-xs whitespace-pre-line">{order.orderCompanyAddress}</p>}
                    {order.orderCompanyCuit && <p className="print-company-info text-xs">CUIT: {order.orderCompanyCuit}</p>}
                    {order.orderCompanyContactDetails && <p className="print-company-info text-xs whitespace-pre-line">{order.orderCompanyContactDetails}</p>}
                </div>
                <div className="text-right">
                    <h1 className="text-xl font-bold print-title mb-1">{getPrintTitle()}</h1>
                    <p className="print-company-info text-xs">Fecha Ingreso: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                    {order.promisedDeliveryDate && <p className="print-company-info text-xs">Entrega Estimada: {format(parseISO(order.promisedDeliveryDate as string), "dd/MM/yyyy HH:mm", { locale: es })}</p>}
                    <p className="print-company-info text-xs">Estado Actual: {order.status}</p>
                     <Image 
                        src="https://placehold.co/80x80.png?text=QR" 
                        alt="QR Code Placeholder" 
                        width={70} 
                        height={70} 
                        className="mt-2 ml-auto print-qr-code"
                        data-ai-hint="order QR code"
                     />
                </div>
            </div>
        </div>

        {/* Client Data */}
        <div className="print-section card-print">
            <h3 className="print-section-title"><UserIcon className="inline-block mr-2 h-4 w-4"/>Datos del Cliente</h3>
            {isLoadingClient ? ( <p className="text-sm">Cargando cliente...</p> ) : 
             clientData ? (
              <div className="grid grid-cols-2 gap-x-4 text-sm">
                <p><strong>Nombre:</strong> {clientData.name} {clientData.lastName}</p>
                <p><strong>DNI:</strong> {clientData.dni}</p>
                <p><strong>Teléfono:</strong> {clientData.phone}</p>
                <p><strong>Email:</strong> {clientData.email || "No provisto"}</p>
                {clientData.address && <p className="col-span-2"><strong>Dirección:</strong> {clientData.address}</p>}
              </div>
            ) : ( <p className="text-sm text-destructive">Cliente no encontrado (ID: {order.clientId}).</p> )}
        </div>

        {/* Equipment Data */}
        <div className="print-section card-print">
            <h3 className="print-section-title"><Smartphone className="inline-block mr-2 h-4 w-4"/>Datos del Equipo</h3>
            <div className="grid grid-cols-2 gap-x-4 text-sm">
                <p><strong>Marca:</strong> {order.deviceBrand}</p>
                <p><strong>Modelo:</strong> {order.deviceModel}</p>
                <p><strong>IMEI/Serial:</strong> {order.deviceIMEI}</p>
                <div className="col-span-2 flex items-center">
                    <LockKeyhole className="inline-block mr-1 h-3 w-3 text-muted-foreground"/><strong>Patrón/Clave:</strong>
                    <span className="ml-2 mr-1">{order.unlockPatternInfo && order.unlockPatternInfo !== "No tiene" && order.unlockPatternInfo !== "No recuerda" ? "Registrado en sistema" : (order.unlockPatternInfo || "No provisto")}</span>
                    {order.unlockPatternInfo && order.unlockPatternInfo !== "No tiene" && order.unlockPatternInfo !== "No recuerda" && (
                         <div className="print-pattern-grid ml-2">
                            {Array(9).fill(0).map((_, i) => <div key={i}></div>)}
                         </div>
                    )}
                </div>
                <p className="col-span-2"><strong>Falla Declarada:</strong> {order.declaredFault}</p>
                <p className="col-span-2"><strong>Daños Preexistentes/Observaciones de Ingreso (Riesgo de Rotura):</strong> {order.damageRisk || "Sin observaciones específicas de daños."}</p>
            </div>
        </div>

        {/* Checklist */}
        {showChecklistForPrint && (
            <div className="print-section card-print">
                <h3 className="print-section-title"><ListChecks className="inline-block mr-2 h-4 w-4"/>Checklist de Recepción del Equipo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5 text-xs">
                  {CHECKLIST_ITEMS.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-0.5 border-b border-dashed border-gray-200">
                      <span className="mr-1">{item.label}:</span>
                      <span className="font-medium text-black">
                        {renderChecklistItemValueForPrint(item.id as keyof Checklist, order.checklist[item.id as keyof Checklist])}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs italic mt-2">El checklist se realiza bajo interpretación visual y está sujeto a confirmación y revisión por un técnico especializado.</p>
            </div>
        )}
        
        {/* Technical History / Diagnosis */}
        {showTechnicalCommentsForPrint && (
            <div className="print-section card-print">
                <h3 className="print-section-title"><MessageSquare className="inline-block mr-2 h-4 w-4"/>Diagnóstico / Historial Técnico</h3>
                 <div className="space-y-1.5 text-sm">
                    {order.commentsHistory.map((comment, index) => (
                    <div key={comment.id || index} className="print-comment-item p-1.5 border-b border-gray-200">
                        <p className="font-semibold">{comment.userName || `Técnico ID: ${comment.userId}`} <span className="text-xs text-muted-foreground">- {format(parseISO(comment.timestamp as string), "dd/MM/yy HH:mm", { locale: es })}</span></p>
                        <p className="whitespace-pre-line text-xs">{comment.description}</p>
                    </div>
                    ))}
                </div>
            </div>
        )}

        {/* Budget */}
        {showBudgetForPrint && (
           <div className="print-section card-print">
            <h3 className="print-section-title"><DollarSign className="inline-block mr-2 h-4 w-4"/>Presupuesto</h3>
            <table className="w-full text-sm">
                <tbody>
                    <tr><td className="py-0.5">Costo Repuestos:</td><td className="text-right py-0.5">${order.costSparePart.toFixed(2)}</td></tr>
                    <tr><td className="py-0.5">Costo Mano de Obra:</td><td className="text-right py-0.5">${order.costLabor.toFixed(2)}</td></tr>
                    <tr className="font-bold border-t border-black"><td className="py-1">Total Estimado:</td><td className="text-right py-1">${(order.costSparePart + order.costLabor).toFixed(2)}</td></tr>
                    {order.costPending > 0 && <tr className="italic"><td className="py-0.5">Monto Pendiente de Pago:</td><td className="text-right py-0.5">${order.costPending.toFixed(2)}</td></tr>}
                </tbody>
            </table>
           </div>
        )}
        
        {/* Extended Warranty Details */}
        {showWarrantyDetailsForPrint && order.warrantyStartDate && (
            <div className="print-section card-print">
                <h3 className="print-section-title"><PackageCheck className="inline-block mr-2 h-4 w-4"/>Detalles de Garantía Extendida</h3>
                <div className="text-sm space-y-0.5">
                    <p><strong>Tipo:</strong> {order.warrantyType === '30d' ? '30 Días' : order.warrantyType === '60d' ? '60 Días' : order.warrantyType === '90d' ? '90 Días' : order.warrantyType === 'custom' ? `Personalizada` : 'N/A'}</p>
                    {order.warrantyStartDate && <p><strong>Periodo:</strong> {format(parseISO(order.warrantyStartDate as string), "dd/MM/yyyy", { locale: es })} - {order.warrantyEndDate ? format(parseISO(order.warrantyEndDate as string), "dd/MM/yyyy", { locale: es }) : 'N/A'}</p>}
                    {order.warrantyCoveredItem && <p><strong>Pieza/Procedimiento Cubierto:</strong> {order.warrantyCoveredItem}</p>}
                    {order.warrantyNotes && <p><strong>Notas de Garantía Extendida:</strong> {order.warrantyNotes}</p>}
                    {order.orderWarrantyConditions && <p className="text-xs mt-1"><strong>Condiciones Generales de Garantía del Taller:</strong> {order.orderWarrantyConditions}</p>}
                    {order.orderSnapshottedWarrantyVoidConditionsText && <p className="text-xs mt-1"><strong>Condiciones de Anulación de Garantía:</strong> {order.orderSnapshottedWarrantyVoidConditionsText}</p>}
                </div>
            </div>
        )}

        {/* Legal Disclaimers & Policies - Display relevant snapshotted texts */}
        <div className="print-section card-print print-legal-texts">
            <h3 className="print-section-title"><FileLock2 className="inline-block mr-2 h-4 w-4"/>Términos, Condiciones y Políticas del Servicio</h3>
            {order.orderSnapshottedUnlockDisclaimer && <div className="print-legal-item"><strong>Importante (Desbloqueo):</strong> <p>{order.orderSnapshottedUnlockDisclaimer}</p></div>}
            {order.orderSnapshottedDataLossPolicyText && <div className="print-legal-item"><strong>Pérdida de Información y Política de Privacidad:</strong> <p>{order.orderSnapshottedDataLossPolicyText}</p></div>}
            {order.orderSnapshottedPrivacyPolicy && order.orderSnapshottedDataLossPolicyText !== order.orderSnapshottedPrivacyPolicy && <div className="print-legal-item"><strong>Política de Privacidad Adicional:</strong> <p>{order.orderSnapshottedPrivacyPolicy}</p></div>}
            {order.orderSnapshottedUntestedDevicePolicyText && <div className="print-legal-item"><strong>Equipos Sin Testeo Completo:</strong> <p>{order.orderSnapshottedUntestedDevicePolicyText}</p></div>}
            {order.orderSnapshottedBudgetVariationText && <div className="print-legal-item"><strong>Presupuesto:</strong> <p>{order.orderSnapshottedBudgetVariationText}</p></div>}
            {order.orderSnapshottedHighRiskDeviceText && <div className="print-legal-item"><strong>Equipos con Riesgos Especiales:</strong> <p>{order.orderSnapshottedHighRiskDeviceText}</p></div>}
            {order.orderSnapshottedPartialDamageDisplayText && <div className="print-legal-item"><strong>Pantallas con Daño Parcial:</strong> <p>{order.orderSnapshottedPartialDamageDisplayText}</p></div>}
            {order.orderSnapshottedAbandonmentPolicyText && <div className="print-legal-item"><strong>Política de Retiro y Abandono:</strong> <p>{order.orderSnapshottedAbandonmentPolicyText}</p></div>}
            {order.orderWarrantyConditions && !showWarrantyDetailsForPrint && !order.orderSnapshottedWarrantyVoidConditionsText && <div className="print-legal-item"><strong>Condiciones Generales de Garantía (Taller):</strong><p>{order.orderWarrantyConditions}</p></div>}
            {order.pickupConditions && <div className="print-legal-item"><strong>Condiciones Generales de Retiro:</strong><p>{order.pickupConditions}</p></div>}
        </div>


        {/* Signatures Area */}
        <div className="print-signature-section-container mt-4">
            {showClientReceptionSignature && (
                 <div className="print-signature-area">
                    <p className="text-xs">El cliente declara conocer y aceptar los términos, condiciones, políticas y descargos de responsabilidad detallados en este documento, así como el estado de recepción del equipo.</p>
                    <div className="mt-8">
                        <p className="print-signature-line">Firma Cliente (Recepción):</p>
                        <p className="print-signature-clarification">Aclaración: {order.customerSignatureName || (clientData ? `${clientData.name} ${clientData.lastName}`: '____________________')}</p>
                        <p className="print-signature-clarification">DNI: {clientData?.dni || '____________________'}</p>
                    </div>
                </div>
            )}
            {showTechnicianReceptionSignature && (
                 <div className="print-signature-area">
                     <p className="text-xs">El técnico abajo firmante constata el estado de recepción del equipo y los detalles declarados por el cliente.</p>
                    <div className="mt-8">
                        <p className="print-signature-line">Firma Técnico (Recepción/Verificación):</p>
                        <p className="print-signature-clarification">Aclaración:</p>
                        <p className="print-signature-clarification">Legajo/ID Técnico:</p>
                    </div>
                </div>
            )}
            {showClientBudgetSignature && (
                <div className="print-signature-area">
                    <p className="text-xs">El cliente declara ACEPTAR / RECHAZAR (tachar lo que no corresponda) el presupuesto detallado y autoriza la reparación bajo las condiciones indicadas.</p>
                    <div className="mt-8">
                        <p className="print-signature-line">Firma Cliente (Presupuesto):</p>
                        <p className="print-signature-clarification">Aclaración:</p>
                        <p className="print-signature-clarification">DNI:</p>
                    </div>
                </div>
            )}
            {showClientDeliverySignature && (
                 <div className="print-signature-area">
                    <p className="text-xs">El cliente declara recibir el equipo reparado (o no reparado según corresponda) de conformidad y acepta las condiciones de garantía si aplicasen.</p>
                    <div className="mt-8">
                        <p className="print-signature-line">Firma Cliente (Entrega/Retiro):</p>
                        <p className="print-signature-clarification">Aclaración:</p>
                        <p className="print-signature-clarification">DNI:</p>
                    </div>
                </div>
            )}
        </div>
        
        <div className="print-footer-container mt-6 pt-3 border-t border-black text-center">
            <p className="text-xs font-semibold">{order.orderCompanyName} - {order.orderCompanyContactDetails?.split('\n')[0]}</p>
             <p className="text-xs">{order.orderCompanyAddress}</p>
        </div>
      
        {/* ----- INICIO HOJA 3: COMPROBANTE DE RETIRO PARA EL CLIENTE ----- */}
        <div className="print-page-break-before print-section-receipt">
          <div className="receipt-header text-center mb-4">
            {order.orderCompanyLogoUrl && !order.orderCompanyLogoUrl.includes('placehold.co') ? (
              <Image
                src={order.orderCompanyLogoUrl}
                alt={order.orderCompanyName || "Company Logo"}
                width={100} 
                height={40}
                className="print-logo mx-auto mb-2 object-contain"
                data-ai-hint="company logo small"
              />
            ) : order.orderCompanyLogoUrl && order.orderCompanyLogoUrl.includes('placehold.co') ? (
                <Image
                    src={order.orderCompanyLogoUrl}
                    alt="Placeholder Logo"
                    width={100}
                    height={40}
                    className="print-logo mx-auto mb-2 object-contain"
                    data-ai-hint="company logo small placeholder"
                />
            ) : null}
            <h2 className="text-lg font-bold uppercase">{order.orderCompanyName || "Comprobante de Servicio"}</h2>
            <p className="text-xs">{order.orderCompanyAddress}</p>
            <p className="text-xs">{order.orderCompanyContactDetails?.split('\n')[0]}</p>
          </div>

          <div className="text-center border-y border-dashed border-black py-2 my-3">
             <h3 className="text-xl font-bold">COMPROBANTE DE RETIRO</h3>
             <p className="text-sm">Orden de Servicio N°: <span className="font-semibold">{order.orderNumber}</span></p>
          </div>

          <div className="receipt-details grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
            <div className="col-span-2">
              <strong>Cliente:</strong> {clientData ? `${clientData.name} ${clientData.lastName}` : order.customerSignatureName || 'N/A'} (DNI: {clientData?.dni || 'N/A'})
            </div>
            <div><strong>Equipo:</strong> {order.deviceBrand} {order.deviceModel}</div>
            <div><strong>IMEI/Serie:</strong> {order.deviceIMEI}</div>
            <div className="col-span-2"><strong>Falla Declarada:</strong> {order.declaredFault}</div>
            <div><strong>Fecha Ingreso:</strong> {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm", { locale: es })}</div>
             {order.promisedDeliveryDate && 
                <div><strong>Entrega Estimada:</strong> {format(parseISO(order.promisedDeliveryDate as string), "dd/MM/yyyy HH:mm", { locale: es })}</div>
             }
            <div><strong>Estado Actual:</strong> <span className="font-semibold">{order.status}</span></div>
             {(order.costSparePart + order.costLabor > 0) && 
                <div className="font-semibold"><strong>Total Presupuestado:</strong> ${(order.costSparePart + order.costLabor).toFixed(2)}</div>
             }
            {order.costPending > 0 && 
                <div className="font-semibold text-red-600"><strong>Monto Pendiente:</strong> ${order.costPending.toFixed(2)}</div>
            }
          </div>
          
          <div className="text-center my-3">
            <p className="text-sm font-semibold">Presentar este comprobante para retirar el equipo.</p>
            {order.pickupConditions && <p className="text-xs mt-1 italic">Condiciones de Retiro: {order.pickupConditions}</p>}
          </div>

          <div className="receipt-signature-area mt-8 pt-6 border-t border-dashed border-black text-sm">
            <p className="mb-1">Recibí conforme el equipo detallado en las condiciones indicadas y acepto los términos de servicio y garantía (si aplica).</p>
            <div className="grid grid-cols-2 gap-x-6 mt-10">
                <div>
                    <div className="border-b border-black pb-6"></div>
                    <p className="text-center mt-1">Firma del Cliente</p>
                </div>
                <div>
                    <div className="border-b border-black pb-6"></div>
                    <p className="text-center mt-1">Aclaración y DNI</p>
                </div>
            </div>
            <p className="text-xs text-center mt-4">Fecha de Retiro: _____ / _____ / __________</p>
          </div>

          <div className="receipt-footer text-center mt-6 text-xs">
            <p>Gracias por confiar en {order.orderCompanyName || "nosotros"}.</p>
             <Image 
                src="https://placehold.co/70x70.png?text=QR" 
                alt="QR Code Placeholder" 
                width={50} 
                height={50} 
                className="mt-2 mx-auto print-qr-code-small"
                data-ai-hint="order QR code small"
             />
          </div>
        </div>
        {/* ----- FIN HOJA 3 ----- */}
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
              Fecha de Ingreso: {format(parseISO(order.entryDate as string), "dd MMM yyyy, HH:mm", { locale: es })}
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
          <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Imprimir Documento</Button>
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
                <p><strong>Clave/Patrón:</strong> {order.unlockPatternInfo ? "Registrado (Ver en edición)" : "No provisto"} <span className="text-xs italic">(Información sensible)</span></p>
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
                       <span className={`font-medium ${order.checklist[item.id as keyof Checklist] === 'si' ? 'text-green-600' : (order.checklist[item.id as keyof Checklist] === 'no' ? 'text-red-600' : 'text-muted-foreground')}`}>
                        {renderChecklistItemValueForPrint(item.id as keyof Checklist, order.checklist[item.id as keyof Checklist])}
                      </span>
                    </div>
                  ))}
                </div>
                 <p className="text-xs italic mt-2">El checklist se realiza bajo interpretación visual y está sujeto a confirmación y revisión por un técnico especializado.</p>
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
                 <div className="space-y-4 max-h-60 overflow-y-auto pr-2 no-print-scroll">
                    {order.commentsHistory.map((comment, index) => (
                    <div key={comment.id || index} className="text-sm p-3 bg-muted/30 rounded-md border">
                        <p className="font-semibold">{comment.userName || `Usuario ID: ${comment.userId}`} <span className="text-xs text-muted-foreground">- {format(parseISO(comment.timestamp as string), "dd MMM yyyy, HH:mm", { locale: es })}</span></p>
                        <p className="whitespace-pre-line">{comment.description}</p>
                    </div>
                    ))}
                </div>
            </div>
            </>
          )}

          {/* Parts Used Section */}
            <Separator/>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><Cog className="h-5 w-5 text-primary"/>Piezas Utilizadas</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => toast({title: "Info", description: "Funcionalidad para agregar pieza en desarrollo."})}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Agregar Pieza
                    </Button>
                </CardHeader>
                <CardContent>
                    {(order.partsUsed && order.partsUsed.length > 0) ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre Pieza</TableHead>
                                        <TableHead className="text-center">Cantidad</TableHead>
                                        <TableHead className="text-right">Precio Unit.</TableHead>
                                        <TableHead className="text-right">Precio Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.partsUsed.map((part, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{part.partName}</TableCell>
                                            <TableCell className="text-center">{part.quantity}</TableCell>
                                            <TableCell className="text-right">${part.unitPrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-semibold">${part.totalPrice.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No se han registrado piezas utilizadas para esta orden.</p>
                    )}
                </CardContent>
            </Card>

          {(order.costSparePart > 0 || order.costLabor > 0 || order.costPending !== 0) && (
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
                        <p className={order.costPending > 0 ? "text-destructive font-semibold" : ""}><strong>Pendiente:</strong> ${order.costPending.toFixed(2)}</p>
                        <p className="sm:col-span-3 font-bold text-base"><strong>Total Estimado:</strong> ${(order.costSparePart + order.costLabor).toFixed(2)}</p>
                    </div>
                )}
               </div>
            </>
          )}

            {/* Payment History Section */}
            <Separator/>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary"/>Historial de Pagos</CardTitle>
                     <Button variant="outline" size="sm" onClick={() => toast({title: "Info", description: "Funcionalidad para registrar pago en desarrollo."})}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Registrar Pago
                    </Button>
                </CardHeader>
                <CardContent>
                    {(order.paymentHistory && order.paymentHistory.length > 0) ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead>Notas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.paymentHistory.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{format(parseISO(payment.date as string), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
                                            <TableCell>{payment.method}</TableCell>
                                            <TableCell className="text-right font-semibold">${payment.amount.toFixed(2)}</TableCell>
                                            <TableCell>{payment.notes || "N/A"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No se han registrado pagos para esta orden.</p>
                    )}
                </CardContent>
            </Card>
          
          {order.hasWarranty && (
             <>
                <Separator/>
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><PackageCheck className="h-5 w-5 text-primary"/>Detalles de Garantía Extendida</h3>
                    <div className="text-sm space-y-1">
                        <p><strong>Tipo:</strong> {order.warrantyType === '30d' ? '30 Días' : order.warrantyType === '60d' ? '60 Días' : order.warrantyType === '90d' ? '90 Días' : order.warrantyType === 'custom' ? `Personalizada` : 'N/A'}</p>
                        {order.warrantyStartDate && <p><strong>Inicio:</strong> {format(parseISO(order.warrantyStartDate as string), "dd MMM yyyy", { locale: es })}</p>}
                        {order.warrantyEndDate && <p><strong>Fin:</strong> {format(parseISO(order.warrantyEndDate as string), "dd MMM yyyy", { locale: es })}</p>}
                        {order.warrantyCoveredItem && <p><strong>Pieza/Procedimiento Cubierto:</strong> {order.warrantyCoveredItem}</p>}
                        {order.warrantyNotes && <p><strong>Notas de Garantía Extendida:</strong> {order.warrantyNotes}</p>}
                        {order.orderWarrantyConditions && <p className="text-xs mt-1"><strong>Condiciones Generales de Garantía (Taller):</strong> {order.orderWarrantyConditions}</p>}
                        {order.orderSnapshottedWarrantyVoidConditionsText && <p className="text-xs mt-1"><strong>Condiciones Anulación Garantía:</strong> {order.orderSnapshottedWarrantyVoidConditionsText}</p>}
                    </div>
                </div>
             </>
          )}


          <Separator/>
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary"/>Seguimiento y Fechas</h3>
            <div className="text-sm space-y-1">
                <p><strong>Última Actualización:</strong> {format(parseISO(order.updatedAt as string), "dd MMM yyyy, HH:mm", { locale: es })} {user?.uid === order.lastUpdatedBy ? `por ${user.name}` : ``}</p>
                {order.promisedDeliveryDate && <p><strong>Fecha Prometida:</strong> {format(parseISO(order.promisedDeliveryDate as string), "dd MMM yyyy, HH:mm", { locale: es })}</p>}
                {order.readyForPickupDate && <p><strong>Listo para Retirar:</strong> {format(parseISO(order.readyForPickupDate as string), "dd MMM yyyy, HH:mm", { locale: es })}</p>}
                {order.deliveryDate && <p><strong>Entregado:</strong> {format(parseISO(order.deliveryDate as string), "dd MMM yyyy, HH:mm", { locale: es })}</p>}
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
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 no-print-scroll">
            {order.commentsHistory.length > 0 ? order.commentsHistory.map((comment, index) => (
              <div key={comment.id || index} className="text-sm p-3 bg-muted/30 rounded-md border">
                <p className="font-semibold">{comment.userName || `Usuario ID: ${comment.userId}`} <span className="text-xs text-muted-foreground">- {format(parseISO(comment.timestamp as string), "dd MMM yyyy, HH:mm", { locale: es })}</span></p>
                <p className="whitespace-pre-line">{comment.description}</p>
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
