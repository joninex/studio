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
import { AISuggestion, type Order, type StoreSettings, WarrantyType, OrderStatus, Classification, Checklist } from "@/types";
import { 
  CHECKLIST_ITEMS, CLASSIFICATION_OPTIONS, ORDER_STATUSES, 
  YES_NO_OPTIONS, DEFAULT_STORE_SETTINGS, WARRANTY_TYPE_OPTIONS, WARRANTY_TYPES, SALE_CON_HUELLA_OPTIONS
} from "@/lib/constants";
import { AlertCircle, Bot, CalendarIcon, DollarSign, Info, ListChecks, LucideSparkles, User, Wrench, LinkIcon, Building, UserSquare, ShieldCheck, FileLock2, FileTextIcon, LockKeyhole, ClipboardSignature } from "lucide-react";
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
  const [isLoadingStoreSettings, setIsLoadingStoreSettings] = useState(!orderId); // Initially true if new order
  const [currentStoreSettings, setCurrentStoreSettings] = useState<StoreSettings | null>(null);

  const defaultChecklistValues = CHECKLIST_ITEMS.reduce((acc, item) => {
    if (item.type === 'boolean') {
      // @ts-ignore
      acc[item.id] = ['enciende', 'tactil', 'imagen', 'botones', 'cam_trasera', 'cam_delantera', 'vibrador', 'microfono', 'auricular', 'parlante', 'sensor_huella', 'senal', 'wifi_bluetooth', 'pin_carga', 'lente_camara'].includes(item.id) ? 'si' : 'no';
    } else if (item.type === 'text') {
      // @ts-ignore
      acc[item.id] = "";
    } else if (item.type === 'enum_saleConHuella') {
      // @ts-ignore
      acc[item.id] = "no_tiene";
    }
    return acc;
  }, {} as OrderFormData['checklist']);


  const form = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      clientId: "",
      branchInfo: DEFAULT_STORE_SETTINGS.branchInfo || "Sucursal Principal",
      deviceBrand: "", deviceModel: "", deviceIMEI: "", declaredFault: "",
      unlockPatternInfo: "",
      checklist: defaultChecklistValues,
      damageRisk: "",
      pantalla_parcial: false,
      equipo_sin_acceso: false,
      perdida_informacion: false,
      previousOrderId: "",
      costSparePart: 0, costLabor: 0, costPending: 0,
      classification: undefined, observations: "",
      customerAccepted: false, 
      customerSignatureName: "",
      // Snapshotted texts will be filled from store settings on load or from existing order
      orderSnapshottedDataLossDisclaimer: "",
      orderSnapshottedPrivacyPolicy: "",
      orderSnapshottedImportantUnlockDisclaimer: "",
      orderSnapshottedAbandonmentPolicyText: "",
      orderSnapshottedDataRetrievalPolicyText: "",
      orderSnapshottedUntestedDevicePolicyText: "",
      orderSnapshottedBudgetVariationText: "",
      orderSnapshottedHighRiskDeviceText: "",
      orderSnapshottedPartialDamageDisplayText: "",
      orderSnapshottedWarrantyVoidConditionsText: "",
      // Acceptance flags
      dataLossDisclaimerAccepted: false,
      privacyPolicyAccepted: false,
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

  useEffect(() => {
    async function fetchInitialData() {
      if (user) {
        setIsLoadingStoreSettings(true);
        try {
          const userSettings = await getStoreSettingsForUser(user.uid);
          setCurrentStoreSettings(userSettings); // Store fetched settings
          if (!orderId) { // New order: Apply user's current store settings
            form.setValue('branchInfo', userSettings.branchInfo || DEFAULT_STORE_SETTINGS.branchInfo || "Sucursal Principal");
            // Snapshot all relevant legal texts
            form.setValue('orderSnapshottedDataLossDisclaimer', userSettings.dataLossDisclaimerText || "");
            form.setValue('orderSnapshottedPrivacyPolicy', userSettings.privacyPolicyText || "");
            form.setValue('orderSnapshottedImportantUnlockDisclaimer', userSettings.importantUnlockDisclaimer || "");
            form.setValue('orderSnapshottedAbandonmentPolicyText', userSettings.abandonmentPolicyText || "");
            form.setValue('orderSnapshottedDataRetrievalPolicyText', userSettings.dataRetrievalPolicyText || "");
            form.setValue('orderSnapshottedUntestedDevicePolicyText', userSettings.untestedDevicePolicyText || "");
            form.setValue('orderSnapshottedBudgetVariationText', userSettings.budgetVariationText || "");
            form.setValue('orderSnapshottedHighRiskDeviceText', userSettings.highRiskDeviceText || "");
            form.setValue('orderSnapshottedPartialDamageDisplayText', userSettings.partialDamageDisplayText || "");
            form.setValue('orderSnapshottedWarrantyVoidConditionsText', userSettings.warrantyVoidConditionsText || "");
          }
        } catch (error) {
          console.error("Failed to load user store settings:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración de su tienda. Se usarán valores por defecto." });
          setCurrentStoreSettings(DEFAULT_STORE_SETTINGS); // Fallback to defaults
           if (!orderId) { // Apply defaults if new order and fetch failed
            form.setValue('branchInfo', DEFAULT_STORE_SETTINGS.branchInfo || "Error carga config");
            form.setValue('orderSnapshottedDataLossDisclaimer', DEFAULT_STORE_SETTINGS.dataLossDisclaimerText || "");
            form.setValue('orderSnapshottedPrivacyPolicy', DEFAULT_STORE_SETTINGS.privacyPolicyText || "");
            form.setValue('orderSnapshottedImportantUnlockDisclaimer', DEFAULT_STORE_SETTINGS.importantUnlockDisclaimer || "");
            form.setValue('orderSnapshottedAbandonmentPolicyText', DEFAULT_STORE_SETTINGS.abandonmentPolicyText || "");
            form.setValue('orderSnapshottedDataRetrievalPolicyText', DEFAULT_STORE_SETTINGS.dataRetrievalPolicyText || "");
            form.setValue('orderSnapshottedUntestedDevicePolicyText', DEFAULT_STORE_SETTINGS.untestedDevicePolicyText || "");
            form.setValue('orderSnapshottedBudgetVariationText', DEFAULT_STORE_SETTINGS.budgetVariationText || "");
            form.setValue('orderSnapshottedHighRiskDeviceText', DEFAULT_STORE_SETTINGS.highRiskDeviceText || "");
            form.setValue('orderSnapshottedPartialDamageDisplayText', DEFAULT_STORE_SETTINGS.partialDamageDisplayText || "");
            form.setValue('orderSnapshottedWarrantyVoidConditionsText', DEFAULT_STORE_SETTINGS.warrantyVoidConditionsText || "");
          }
        } finally {
          setIsLoadingStoreSettings(false);
        }
      }

      if (orderId) {
        setIsLoadingOrder(true);
        try {
          const order = await getOrderById(orderId);
          if (order) {
            form.reset({
              ...order,
              checklist: { 
                ...defaultChecklistValues, // Start with defaults
                ...(order.checklist || {}), // Override with actual order values
              },
              clientId: order.clientId,
              unlockPatternInfo: order.unlockPatternInfo || "",
              previousOrderId: order.previousOrderId || "",
              costSparePart: Number(order.costSparePart || 0),
              costLabor: Number(order.costLabor || 0),
              costPending: Number(order.costPending || 0),
              classification: order.classification as Classification || undefined,
              status: order.status || "Recibido",
              branchInfo: order.branchInfo,
              customerAccepted: order.customerAccepted || false,
              customerSignatureName: order.customerSignatureName || "",
              // Reset snapshotted texts from the loaded order
              orderSnapshottedDataLossDisclaimer: order.orderSnapshottedDataLossDisclaimer || "",
              orderSnapshottedPrivacyPolicy: order.orderSnapshottedPrivacyPolicy || "",
              orderSnapshottedImportantUnlockDisclaimer: order.orderSnapshottedImportantUnlockDisclaimer || "",
              orderSnapshottedAbandonmentPolicyText: order.orderSnapshottedAbandonmentPolicyText || "",
              orderSnapshottedDataRetrievalPolicyText: order.orderSnapshottedDataRetrievalPolicyText || "",
              orderSnapshottedUntestedDevicePolicyText: order.orderSnapshottedUntestedDevicePolicyText || "",
              orderSnapshottedBudgetVariationText: order.orderSnapshottedBudgetVariationText || "",
              orderSnapshottedHighRiskDeviceText: order.orderSnapshottedHighRiskDeviceText || "",
              orderSnapshottedPartialDamageDisplayText: order.orderSnapshottedPartialDamageDisplayText || "",
              orderSnapshottedWarrantyVoidConditionsText: order.orderSnapshottedWarrantyVoidConditionsText || "",
              // Acceptance flags
              dataLossDisclaimerAccepted: order.dataLossDisclaimerAccepted || false,
              privacyPolicyAccepted: order.privacyPolicyAccepted || false,
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
    if (user) {
        fetchInitialData();
    }
  }, [orderId, user, form, router, toast, defaultChecklistValues]);

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
         form.setValue('warrantyEndDate', null); // Clear if error
      }
    } else if (hasWarrantyWatch && warrantyTypeWatch === 'custom') {
      // Allow manual input, no automatic calculation
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
      // If it's a new order, currentStoreSettings should already be in form values from useEffect
      // If it's an existing order, the form values for snapshotted texts are already from the loaded order.
      // So, we just use values directly.

      const submissionValues: OrderFormData = {
        ...values,
        unlockPatternInfo: values.unlockPatternInfo,
        previousOrderId: values.previousOrderId?.trim() === "" ? undefined : values.previousOrderId?.trim(),
        warrantyType: values.hasWarranty ? values.warrantyType : NONE_WARRANTY_TYPE_VALUE as WarrantyType,
        warrantyStartDate: values.hasWarranty && values.warrantyStartDate ? values.warrantyStartDate : null,
        warrantyEndDate: values.hasWarranty && values.warrantyEndDate ? values.warrantyEndDate : null,
        warrantyCoveredItem: values.hasWarranty ? values.warrantyCoveredItem : "",
        warrantyNotes: values.hasWarranty ? values.warrantyNotes : "",
        status: values.status || "Recibido", 
        // Ensure checklist values are correct
        checklist: CHECKLIST_ITEMS.reduce((acc, item) => {
          // @ts-ignore
          acc[item.id] = values.checklist[item.id] || (item.type === 'boolean' ? 'no' : (item.type === 'enum_saleConHuella' ? 'no_tiene' : ''));
          return acc;
        }, {} as Checklist),
      };

      if (orderId) {
        result = await updateOrder(orderId, submissionValues, user.uid);
      } else {
        // For new orders, explicitly set snapshotted texts from currentStoreSettings (or defaults if not loaded)
        // This ensures they are captured at creation time.
        const settingsSource = currentStoreSettings || DEFAULT_STORE_SETTINGS;
        submissionValues.orderSnapshottedDataLossDisclaimer = settingsSource.dataLossDisclaimerText || "";
        submissionValues.orderSnapshottedPrivacyPolicy = settingsSource.privacyPolicyText || "";
        submissionValues.orderSnapshottedImportantUnlockDisclaimer = settingsSource.importantUnlockDisclaimer || "";
        submissionValues.orderSnapshottedAbandonmentPolicyText = settingsSource.abandonmentPolicyText || "";
        submissionValues.orderSnapshottedDataRetrievalPolicyText = settingsSource.dataRetrievalPolicyText || "";
        submissionValues.orderSnapshottedUntestedDevicePolicyText = settingsSource.untestedDevicePolicyText || "";
        submissionValues.orderSnapshottedBudgetVariationText = settingsSource.budgetVariationText || "";
        submissionValues.orderSnapshottedHighRiskDeviceText = settingsSource.highRiskDeviceText || "";
        submissionValues.orderSnapshottedPartialDamageDisplayText = settingsSource.partialDamageDisplayText || "";
        submissionValues.orderSnapshottedWarrantyVoidConditionsText = settingsSource.warrantyVoidConditionsText || "";
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

  if ((isLoadingOrder && orderId) || (isLoadingStoreSettings && !currentStoreSettings) ) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={48}/> <p className="ml-4">Cargando datos del formulario...</p></div>;
  }

  // Get current snapshotted texts for display in acceptance section
  const displayDataLossDisclaimer = form.watch('orderSnapshottedDataLossDisclaimer') || currentStoreSettings?.dataLossDisclaimerText || DEFAULT_STORE_SETTINGS.dataLossDisclaimerText;
  const displayPrivacyPolicy = form.watch('orderSnapshottedPrivacyPolicy') || currentStoreSettings?.privacyPolicyText || DEFAULT_STORE_SETTINGS.privacyPolicyText;


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
                <p className="text-sm text-muted-foreground mb-2">Marque según corresponda. "Sí" implica funcionalidad al 100% donde aplique.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {CHECKLIST_ITEMS.map(item => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`checklist.${item.id as keyof OrderFormData['checklist']}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                        <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                        <FormControl>
                          {item.type === 'boolean' ? (
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-2">
                              {YES_NO_OPTIONS.map(opt => (
                                <FormItem key={opt.value} className="flex items-center space-x-1 space-y-0">
                                  <FormControl><RadioGroupItem value={opt.value} /></FormControl>
                                  <FormLabel className="font-normal text-xs">{opt.label}</FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          ) : item.type === 'text' ? (
                            <Input type="text" {...field} className="h-8 text-xs w-20"/>
                          ) : item.type === 'enum_saleConHuella' ? (
                             <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-1 sm:space-x-2">
                              {SALE_CON_HUELLA_OPTIONS.map(opt => (
                                <FormItem key={opt.value} className="flex items-center space-x-0.5 sm:space-x-1 space-y-0">
                                  <FormControl><RadioGroupItem value={opt.value} /></FormControl>
                                  <FormLabel className="font-normal text-xs">{opt.label}</FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          ) : null}
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
                </div>
                 <FormDescription className="pt-2 text-xs">El checklist se realiza bajo interpretación visual y está sujeto a confirmación y revisión por un técnico especializado.</FormDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="text-primary"/> Riesgos y Condiciones Específicas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="damageRisk" render={({ field }) => ( <FormItem><FormLabel>Riesgo de Rotura (Daños preexistentes, ej: Cristal trizado)</FormLabel><FormControl><Textarea placeholder="Describa daños específicos..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <div className="space-y-2">
                    <FormLabel>Condiciones Específicas Adicionales (Marcar si aplica)</FormLabel>
                    <FormField control={form.control} name="pantalla_parcial" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal">Pantalla con daño parcial (puede agravarse al desarmar)</FormLabel>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="equipo_sin_acceso" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal">Equipo sin clave/patrón o que no enciende (testeo limitado)</FormLabel>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="perdida_informacion" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal">Alto riesgo de pérdida de información (a considerar por el técnico)</FormLabel>
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
                      onValueChange={(selectedValue) => field.onChange(selectedValue === NONE_CLASSIFICATION_VALUE ? null : selectedValue as Classification)}
                      value={field.value === null || field.value === undefined || field.value === "" ? NONE_CLASSIFICATION_VALUE : field.value}
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
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/> Detalles de Garantía Extendida</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="hasWarranty"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">¿Aplicar Garantía Extendida?</FormLabel>
                    <FormDescription>
                      Marque si esta reparación incluye una garantía extendida por escrito.
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
                                format(new Date(field.value  + 'T00:00:00'), "PPP", { weekStartsOn: 1 }) // Ensure date is parsed correctly
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
                            selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
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
                                format(new Date(field.value + 'T00:00:00'), "PPP", { weekStartsOn: 1 })
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
                            selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                            disabled={(date) =>
                              warrantyStartDateWatch ? date < new Date(warrantyStartDateWatch + 'T00:00:00') : false
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
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardSignature className="text-primary"/> Aceptación de Términos por el Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="observations" render={({ field }) => ( <FormItem><FormLabel>Observaciones Adicionales Generales de la Orden</FormLabel><FormControl><Textarea placeholder="Comentarios o información relevante para la orden..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="customerSignatureName" render={({ field }) => ( <FormItem><FormLabel>Nombre del Cliente que Acepta (para registro)</FormLabel><FormControl><Input placeholder="Nombre completo del cliente" {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="customerAccepted" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aceptación General de Condiciones y Políticas</FormLabel>
                  <FormDescription>El cliente acepta las condiciones generales del servicio, el estado de recepción del equipo, las políticas de desbloqueo, pérdida de datos, privacidad, y demás términos detallados que serán impresos en el comprobante.</FormDescription>
                   <FormMessage />
                </div>
              </FormItem>
            )} />
            
            {/* Displaying the text for acceptance if available */}
            {(displayDataLossDisclaimer && displayDataLossDisclaimer.trim() !== "") && (
              <FormField control={form.control} name="dataLossDisclaimerAccepted" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aceptación del Descargo por Pérdida de Datos</FormLabel>
                    <FormDescription className="text-xs max-h-20 overflow-y-auto">{displayDataLossDisclaimer}</FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
            )}

            {(displayPrivacyPolicy && displayPrivacyPolicy.trim() !== "") && (
              <FormField control={form.control} name="privacyPolicyAccepted" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aceptación de la Política de Privacidad y Acceso al Dispositivo</FormLabel>
                    <FormDescription className="text-xs max-h-20 overflow-y-auto">{displayPrivacyPolicy}</FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
            )}
             <FormDescription className="text-xs italic">
                Las políticas completas (Desbloqueo, Abandono, Variación de Presupuesto, Riesgos, etc.) configuradas por el taller se imprimirán en el comprobante final y se consideran aceptadas con la "Aceptación General".
            </FormDescription>
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
