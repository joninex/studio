// src/components/orders/OrderForm.tsx
"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import type { z } from "zod";
import { format, addDays } from "date-fns";

import { OrderSchema, type OrderFormData } from "@/lib/schemas";
import { createOrder, getRepairSuggestions, updateOrder, getOrderById } from "@/lib/actions/order.actions";
import { getStoreSettingsForUser } from "@/lib/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { AISuggestion, type Order, type StoreSettings, WarrantyType, OrderStatus, Classification } from "@/types";
import { 
  CHECKLIST_ITEMS, CLASSIFICATION_OPTIONS, ORDER_STATUSES, 
  YES_NO_OPTIONS, DEFAULT_STORE_SETTINGS, WARRANTY_TYPE_OPTIONS, WARRANTY_TYPES, UNLOCK_PATTERN_INFO_SUGGESTIONS
} from "@/lib/constants";
import { AlertCircle, Bot, CalendarIcon, DollarSign, Info, ListChecks, LucideSparkles, User, Wrench, LinkIcon, Building, UserSquare, ShieldCheck, FileLock2, FileTextIcon, LockKeyhole } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";

interface OrderFormProps {
  orderId?: string;
}

const NONE_CLASSIFICATION_VALUE = "__NONE_CLASSIFICATION_VALUE__";
const NONE_WARRANTY_TYPE_VALUE = "";

const validOrderStatusOptions = ORDER_STATUSES.filter(status => status !== "") as OrderStatus[];
const validClassificationOptions = CLASSIFICATION_OPTIONS.filter(opt => opt !== "") as Classification[];


export function OrderForm({ orderId }: OrderFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(!!orderId);
  const [isLoadingStoreSettings, setIsLoadingStoreSettings] = useState(!orderId);
  const [currentStoreSettings, setCurrentStoreSettings] = useState<StoreSettings | null>(null);


  const form = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      clientId: "",
      branchInfo: DEFAULT_STORE_SETTINGS.branchInfo || "Sucursal Principal",
      deviceBrand: "", deviceModel: "", deviceIMEI: "", declaredFault: "",
      unlockPatternInfo: "", // Now a string
      checklist: CHECKLIST_ITEMS.reduce((acc, item) => {
        // @ts-ignore
        acc[item.id] = ['enciende', 'tactil', 'imagen', 'botones', 'cam_trasera', 'cam_delantera', 'vibrador', 'microfono', 'auricular', 'parlante', 'sensor_huella', 'senal', 'wifi_bluetooth', 'pin_carga', 'lente_camara'].includes(item.id) ? 'si' : 'no';
        return acc;
      }, {} as OrderFormData['checklist']),
      damageRisk: "",
      pantalla_parcial: false,
      equipo_sin_acceso: false,
      perdida_informacion: false, // Risk checkbox
      previousOrderId: "",
      costSparePart: 0, costLabor: 0, costPending: 0,
      classification: undefined, observations: "",
      customerAccepted: false, 
      customerSignatureName: "",
      dataLossDisclaimerAccepted: false,
      privacyPolicyAccepted: false,
      orderSnapshottedDataLossDisclaimer: "",
      orderSnapshottedPrivacyPolicy: "",
      status: "Recibido",
      hasWarranty: false,
      warrantyType: NONE_WARRANTY_TYPE_VALUE as WarrantyType,
      warrantyStartDate: null,
      warrantyEndDate: null,
      warrantyCoveredItem: "",
      warrantyNotes: "",
    },
  });

  const deviceModelWatch = useWatch({ control: form.control, name: "deviceModel" });
  const declaredFaultWatch = useWatch({ control: form.control, name: "declaredFault" });
  const hasWarrantyWatch = useWatch({ control: form.control, name: "hasWarranty" });
  const warrantyTypeWatch = useWatch({ control: form.control, name: "warrantyType" });
  const warrantyStartDateWatch = useWatch({ control: form.control, name: "warrantyStartDate" });

  const dataLossDisclaimerTextWatch = currentStoreSettings?.dataLossDisclaimerText;
  const privacyPolicyTextWatch = currentStoreSettings?.privacyPolicyText;


  useEffect(() => {
    async function fetchInitialData() {
      if (user) { // Always fetch user settings if user is available
        setIsLoadingStoreSettings(true);
        try {
          const userSettings = await getStoreSettingsForUser(user.uid);
          setCurrentStoreSettings(userSettings);
          if (!orderId) { // Only set branchInfo if it's a new order
            form.setValue('branchInfo', userSettings.branchInfo || DEFAULT_STORE_SETTINGS.branchInfo || "Sucursal Principal");
            form.setValue('orderSnapshottedDataLossDisclaimer', userSettings.dataLossDisclaimerText || "");
            form.setValue('orderSnapshottedPrivacyPolicy', userSettings.privacyPolicyText || "");
          }
        } catch (error) {
          console.error("Failed to load user store settings:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración de su tienda." });
          if (!orderId) {
            form.setValue('branchInfo', DEFAULT_STORE_SETTINGS.branchInfo || "Error carga config");
            form.setValue('orderSnapshottedDataLossDisclaimer', DEFAULT_STORE_SETTINGS.dataLossDisclaimerText || "");
            form.setValue('orderSnapshottedPrivacyPolicy', DEFAULT_STORE_SETTINGS.privacyPolicyText || "");
          }
           setCurrentStoreSettings(DEFAULT_STORE_SETTINGS); // Fallback
        } finally {
          setIsLoadingStoreSettings(false);
        }
      }

      if (orderId) {
        setIsLoadingOrder(true);
        try {
          const order = await getOrderById(orderId);
          if (order) {
            const defaultChecklist = CHECKLIST_ITEMS.reduce((acc, item) => {
                // @ts-ignore
                acc[item.id] = ['enciende', 'tactil', 'imagen', 'botones', 'cam_trasera', 'cam_delantera', 'vibrador', 'microfono', 'auricular', 'parlante', 'sensor_huella', 'senal', 'wifi_bluetooth', 'pin_carga', 'lente_camara'].includes(item.id) ? 'si' : 'no';
                return acc;
            }, {} as OrderFormData['checklist']);

            form.reset({
              ...order,
              checklist: { 
                ...defaultChecklist,
                ...(order.checklist || {}),
              },
              clientId: order.clientId,
              unlockPatternInfo: order.unlockPatternInfo || "", // Ensure it's a string
              previousOrderId: order.previousOrderId || "",
              costSparePart: Number(order.costSparePart || 0),
              costLabor: Number(order.costLabor || 0),
              costPending: Number(order.costPending || 0),
              classification: order.classification as Classification || undefined,
              status: order.status || "Recibido",
              branchInfo: order.branchInfo, // Use existing branchInfo from order
              customerAccepted: order.customerAccepted || false,
              customerSignatureName: order.customerSignatureName || "",
              dataLossDisclaimerAccepted: order.dataLossDisclaimerAccepted || false,
              privacyPolicyAccepted: order.privacyPolicyAccepted || false,
              orderSnapshottedDataLossDisclaimer: order.orderSnapshottedDataLossDisclaimer || "",
              orderSnapshottedPrivacyPolicy: order.orderSnapshottedPrivacyPolicy || "",
              hasWarranty: order.hasWarranty || false,
              warrantyType: order.warrantyType || NONE_WARRANTY_TYPE_VALUE as WarrantyType,
              warrantyStartDate: order.warrantyStartDate ? format(new Date(order.warrantyStartDate), "yyyy-MM-dd") : null,
              warrantyEndDate: order.warrantyEndDate ? format(new Date(order.warrantyEndDate), "yyyy-MM-dd") : null,
              warrantyCoveredItem: order.warrantyCoveredItem || "",
              warrantyNotes: order.warrantyNotes || "",
            });
          } else {
            toast({ variant: "destructive", title: "Error", description: "Orden no encontrada." });
            router.push("/orders");
          }
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la orden." });
        } finally {
          setIsLoadingOrder(false);
        }
      }
    }
    if (user) { // Condition ensures user info is available
        fetchInitialData();
    }
  }, [orderId, user, form, router, toast]);

  useEffect(() => {
    if (hasWarrantyWatch && warrantyStartDateWatch && warrantyTypeWatch && warrantyTypeWatch !== 'custom' && warrantyTypeWatch !== NONE_WARRANTY_TYPE_VALUE) {
      try {
        const startDate = new Date(warrantyStartDateWatch);
        if (isNaN(startDate.getTime())) return; 

        let daysToAdd = 0;
        if (warrantyTypeWatch === '30d') daysToAdd = 30;
        else if (warrantyTypeWatch === '60d') daysToAdd = 60;
        else if (warrantyTypeWatch === '90d') daysToAdd = 90;
        
        if (daysToAdd > 0) {
          const endDate = addDays(startDate, daysToAdd);
          form.setValue('warrantyEndDate', format(endDate, "yyyy-MM-dd"));
        }
      } catch (error) {
        console.error("Error calculating warranty end date:", error);
      }
    } else if (hasWarrantyWatch && warrantyTypeWatch === 'custom') {
      // Allow manual input
    } else if (!hasWarrantyWatch) {
        form.setValue('warrantyEndDate', null);
        form.setValue('warrantyStartDate', null);
        form.setValue('warrantyType', NONE_WARRANTY_TYPE_VALUE as WarrantyType);
        form.setValue('warrantyCoveredItem', "");
        form.setValue('warrantyNotes', "");
    }
  }, [hasWarrantyWatch, warrantyTypeWatch, warrantyStartDateWatch, form]);


  const onSubmit = (values: OrderFormData) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Debe iniciar sesión." });
      return;
    }
    startTransition(async () => {
      let result;
      // Ensure snapshotted texts are set from currentStoreSettings if creating new, or existing if editing
      const finalSnapshottedDataLoss = orderId 
        ? values.orderSnapshottedDataLossDisclaimer 
        : currentStoreSettings?.dataLossDisclaimerText || "";
      const finalSnapshottedPrivacy = orderId 
        ? values.orderSnapshottedPrivacyPolicy
        : currentStoreSettings?.privacyPolicyText || "";

      const submissionValues = {
        ...values,
        unlockPatternInfo: values.unlockPatternInfo, // Already a string
        previousOrderId: values.previousOrderId?.trim() === "" ? undefined : values.previousOrderId?.trim(),
        warrantyType: values.hasWarranty ? values.warrantyType : NONE_WARRANTY_TYPE_VALUE as WarrantyType,
        warrantyStartDate: values.hasWarranty && values.warrantyStartDate ? values.warrantyStartDate : null,
        warrantyEndDate: values.hasWarranty && values.warrantyEndDate ? values.warrantyEndDate : null,
        warrantyCoveredItem: values.hasWarranty ? values.warrantyCoveredItem : "",
        warrantyNotes: values.hasWarranty ? values.warrantyNotes : "",
        status: values.status || "Recibido", 
        orderSnapshottedDataLossDisclaimer: finalSnapshottedDataLoss,
        orderSnapshottedPrivacyPolicy: finalSnapshottedPrivacy,
      };

      if (orderId) {
        result = await updateOrder(orderId, submissionValues, user.uid);
      } else {
        result = await createOrder(submissionValues, user.uid);
      }

      if (result.success && result.order?.id) {
        toast({ title: "Éxito", description: result.message });
        router.push(`/orders/${result.order.id}`);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message || "Ocurrió un error." });
      }
    });
  };

  const handleGetAiSuggestions = async () => {
    const deviceModel = form.getValues("deviceModel");
    const faultDescription = form.getValues("declaredFault");

    if (!deviceModel || !faultDescription) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Ingrese marca/modelo y descripción de la falla para obtener sugerencias." });
      return;
    }
    setIsAiLoading(true);
    setAiSuggestion(null);
    const result = await getRepairSuggestions(deviceModel, faultDescription);
    if (result.success && result.suggestion) {
      setAiSuggestion(result.suggestion);
    } else {
      toast({ variant: "destructive", title: "Error IA", description: result.message });
    }
    setIsAiLoading(false);
  };

  if ((isLoadingOrder && orderId) || (isLoadingStoreSettings && user) ) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={48}/> <p className="ml-4">Cargando datos del formulario...</p></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><UserSquare className="text-primary"/> Datos del Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>ID del Cliente</FormLabel>
                        <FormControl><Input placeholder="Ej: CLI001 (Dist. May/Min)" {...field} /></FormControl>
                        <FormDescription>Ingrese el ID de un cliente existente. Próximamente: búsqueda y creación de clientes.</FormDescription>
                        <FormMessage />
                    </FormItem>
                  )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="text-primary"/> Detalles del Equipo y Falla</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="branchInfo" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><Building className="h-4 w-4"/>Sucursal/Taller</FormLabel>
                    <FormControl><Input placeholder="Nombre de la sucursal" {...field} disabled={isLoadingStoreSettings && !orderId} /></FormControl>
                    <FormDescription>Información de la sucursal donde se registra la orden. (Configurable en Ajustes)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deviceBrand" render={({ field }) => ( <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ej: Samsung, Apple" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="deviceModel" render={({ field }) => ( <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ej: Galaxy S21, iPhone 13" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="deviceIMEI" render={({ field }) => ( <FormItem><FormLabel>IMEI</FormLabel><FormControl><Input placeholder="IMEI del equipo" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="declaredFault" render={({ field }) => ( <FormItem><FormLabel>Falla Declarada por el Cliente</FormLabel><FormControl><Textarea placeholder="Descripción de la falla" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="unlockPatternInfo" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><LockKeyhole className="h-4 w-4"/>PIN, Patrón o Contraseña del Dispositivo</FormLabel>
                    <FormControl><Input placeholder="Ej: 1234, L, No tiene, No recuerda" {...field} /></FormControl>
                    <FormDescription>Este campo es obligatorio. Registre la información de desbloqueo o indique si no aplica.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="previousOrderId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><LinkIcon className="h-4 w-4"/>ID Orden Anterior (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ej: ORD123" {...field} /></FormControl>
                    <FormDescription>Si esta reparación está relacionada con una orden anterior (garantía, etc.).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><LucideSparkles className="text-primary"/> Asistente IA de Diagnóstico</CardTitle>
                 <Button type="button" size="sm" onClick={handleGetAiSuggestions} disabled={isAiLoading || !deviceModelWatch || !declaredFaultWatch}>
                  {isAiLoading && <LoadingSpinner size={16} className="mr-2"/>}
                  <Bot className="mr-2 h-4 w-4" /> Sugerir
                </Button>
              </CardHeader>
              <CardContent>
                {aiSuggestion && (
                  <div className="space-y-4 text-sm p-4 bg-accent/20 rounded-md border border-accent">
                    <div><h4 className="font-semibold text-primary">Posibles Causas:</h4><p className="text-muted-foreground">{aiSuggestion.possibleCauses}</p></div>
                    <div><h4 className="font-semibold text-primary">Soluciones Sugeridas:</h4><p className="text-muted-foreground">{aiSuggestion.suggestedSolutions}</p></div>
                  </div>
                )}
                 {(!deviceModelWatch || !declaredFaultWatch) && !aiSuggestion && <p className="text-sm text-muted-foreground">Ingrese Marca/Modelo y Falla para obtener sugerencias de la IA.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="text-primary"/> Checklist de Recepción</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground mb-2">Marque Sí/No según corresponda.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {CHECKLIST_ITEMS.map(item => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`checklist.${item.id}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                        <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex space-x-2"
                          >
                            {YES_NO_OPTIONS.map(opt => (
                              <FormItem key={opt.value} className="flex items-center space-x-1 space-y-0">
                                <FormControl><RadioGroupItem value={opt.value} /></FormControl>
                                <FormLabel className="font-normal text-xs">{opt.label}</FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="text-primary"/> Riesgos y Condiciones Específicas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="damageRisk" render={({ field }) => ( <FormItem><FormLabel>Riesgo de Rotura (Daños preexistentes)</FormLabel><FormControl><Textarea placeholder="Describa daños específicos..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <div className="space-y-2">
                    <FormLabel>Condiciones Específicas (Marcar si aplica)</FormLabel>
                    <FormField control={form.control} name="pantalla_parcial" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal">Pantalla con daño parcial</FormLabel>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="equipo_sin_acceso" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal">Equipo sin clave o que no enciende (sin acceso completo)</FormLabel>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="perdida_informacion" render={({ field }) => ( // This is the risk checkbox, not the disclaimer acceptance
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal">Riesgo de pérdida de información (a considerar por el técnico)</FormLabel>
                        </FormItem>
                    )} />
                 </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-primary"/> Costos y Clasificación</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="costSparePart" render={({ field }) => ( <FormItem><FormLabel>Repuesto ($)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="costLabor" render={({ field }) => ( <FormItem><FormLabel>Mano de Obra ($)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="costPending" render={({ field }) => ( <FormItem><FormLabel>Pendiente ($)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="classification" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clasificación (Para Stock)</FormLabel>
                    <Select
                      onValueChange={(selectedValue) => field.onChange(selectedValue === NONE_CLASSIFICATION_VALUE ? "" : selectedValue)}
                      value={field.value === "" || field.value === undefined ? NONE_CLASSIFICATION_VALUE : field.value}
                      defaultValue={NONE_CLASSIFICATION_VALUE}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione clasificación" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_CLASSIFICATION_VALUE}>Ninguna</SelectItem>
                        {validClassificationOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 {orderId && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado de la Orden</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccione estado" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {validOrderStatusOptions.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator />
        
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/> Detalles de Garantía</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="hasWarranty"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">¿Aplicar Garantía Extendida?</FormLabel>
                    <FormDescription>
                      Marque si esta reparación incluye una garantía extendida.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {hasWarrantyWatch && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                 <FormField
                  control={form.control}
                  name="warrantyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Garantía</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || NONE_WARRANTY_TYPE_VALUE}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione tipo..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {WARRANTY_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warrantyStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha Inicio Garantía</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { weekStartsOn: 1 }) 
                              ) : (
                                <span>Seleccione fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warrantyEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha Fin Garantía</FormLabel>
                       <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={warrantyTypeWatch !== 'custom' && warrantyTypeWatch !== NONE_WARRANTY_TYPE_VALUE}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { weekStartsOn: 1 })
                              ) : (
                                <span>Seleccione fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                            disabled={(date) =>
                              warrantyStartDateWatch ? date < new Date(warrantyStartDateWatch) : false
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        {warrantyTypeWatch !== 'custom' && warrantyTypeWatch !== NONE_WARRANTY_TYPE_VALUE ? "Calculada automáticamente. " : ""}
                        {warrantyTypeWatch === 'custom' ? "Ingrese manualmente." : ""}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warrantyCoveredItem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pieza/Procedimiento Cubierto por Garantía</FormLabel>
                      <FormControl><Input placeholder="Ej: Pantalla completa, Cambio de batería" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warrantyNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales de Garantía</FormLabel>
                      <FormControl><Textarea placeholder="Condiciones específicas, exclusiones, etc." {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileLock2 className="text-primary"/> Aceptación de Términos y Descargos</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="observations" render={({ field }) => ( <FormItem><FormLabel>Observaciones Adicionales Generales</FormLabel><FormControl><Textarea placeholder="Comentarios o información relevante..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="customerSignatureName" render={({ field }) => ( <FormItem><FormLabel>Nombre del Cliente que Acepta</FormLabel><FormControl><Input placeholder="Nombre completo del cliente" {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="customerAccepted" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aceptación General del Cliente</FormLabel>
                  <FormDescription>El cliente acepta las condiciones generales del servicio y el estado de recepción del equipo como se describe en el comprobante.</FormDescription>
                   <FormMessage />
                </div>
              </FormItem>
            )} />

            {dataLossDisclaimerTextWatch && dataLossDisclaimerTextWatch.trim() !== "" && (
              <FormField control={form.control} name="dataLossDisclaimerAccepted" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aceptación del Descargo por Pérdida de Datos</FormLabel>
                    <FormDescription className="text-xs">{dataLossDisclaimerTextWatch}</FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
            )}

            {privacyPolicyTextWatch && privacyPolicyTextWatch.trim() !== "" && (
              <FormField control={form.control} name="privacyPolicyAccepted" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aceptación de la Política de Privacidad y Acceso al Dispositivo</FormLabel>
                    <FormDescription className="text-xs">{privacyPolicyTextWatch}</FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={isPending || isAiLoading || isLoadingStoreSettings || isLoadingOrder}>
          {(isPending || isLoadingStoreSettings || isLoadingOrder) && <LoadingSpinner size={16} className="mr-2"/>}
          {orderId ? (isPending ? "Actualizando Orden..." : "Actualizar Orden") : (isPending || isLoadingStoreSettings ? "Creando Orden..." : "Crear Orden de Servicio")}
        </Button>
      </form>
    </Form>
  );
}
