// src/components/orders/OrderForm.tsx
"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import type { z } from "zod";

import { OrderSchema, type OrderFormData } from "@/lib/schemas";
import { createOrder, getRepairSuggestions, updateOrder, getOrderById } from "@/lib/actions/order.actions";
import { getSettings } from "@/lib/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { AISuggestion, type Order, type Configurations } from "@/types";
import { CHECKLIST_ITEMS, CLASSIFICATION_OPTIONS, ORDER_STATUSES, SPECIFIC_SECTORS_OPTIONS, UNLOCK_PATTERN_OPTIONS, YES_NO_OPTIONS } from "@/lib/constants";
import { AlertCircle, Bot, DollarSign, Info, ListChecks, LucideSparkles, User, Wrench, LinkIcon, Building } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface OrderFormProps {
  orderId?: string; // For editing existing order
}

const NONE_CLASSIFICATION_VALUE = "__NONE_CLASSIFICATION_VALUE__";

export function OrderForm({ orderId }: OrderFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(!!orderId);
  const [appSettings, setAppSettings] = useState<Configurations | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);


  const form = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      clientName: "", clientLastName: "", clientDni: "", clientPhone: "", clientEmail: "",
      branchInfo: "", // Will be populated from settings
      deviceBrand: "", deviceModel: "", deviceIMEI: "", declaredFault: "",
      unlockPatternInfo: undefined,
      checklist: {
        carcasaMarks: "no", screenCrystal: "no", frame: "no", backCover: "no", camera: "no",
        microphone: "no", speaker: "no", powersOn: "si", touchScreen: "si", deviceCamera: "si",
        fingerprintSensor: "si", signal: "si", wifi: "si",
      },
      damageRisk: "", specificSectors: [], previousOrderId: "",
      costSparePart: 0, costLabor: 0, costPending: 0,
      classification: undefined, observations: "",
      customerAccepted: false, customerSignatureName: "",
      status: "En diagnóstico",
    },
  });

  const deviceModelWatch = useWatch({ control: form.control, name: "deviceModel" });
  const declaredFaultWatch = useWatch({ control: form.control, name: "declaredFault" });

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoadingSettings(true);
      try {
        const settings = await getSettings();
        setAppSettings(settings);
        if (!orderId) { // For new orders, set branchInfo from settings
          form.setValue('branchInfo', settings.branchInfo || "Sucursal Principal"); 
        }
      } catch (error) {
        console.error("Failed to load settings for order form:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las configuraciones." });
         if (!orderId) {
          form.setValue('branchInfo', "Sucursal Principal (Error carga config)");
        }
      } finally {
        setIsLoadingSettings(false);
      }

      if (orderId) {
        setIsLoadingOrder(true);
        try {
          const order = await getOrderById(orderId);
          if (order) {
            form.reset({
              ...order,
              previousOrderId: order.previousOrderId || "",
              costSparePart: Number(order.costSparePart || 0),
              costLabor: Number(order.costLabor || 0),
              costPending: Number(order.costPending || 0),
              classification: order.classification || undefined,
              unlockPatternInfo: order.unlockPatternInfo || undefined,
              status: order.status || "En diagnóstico",
              specificSectors: order.specificSectors || [],
              branchInfo: order.branchInfo, // Use existing branchInfo for edits
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
    fetchInitialData();
  }, [orderId, form, router, toast]);


  const onSubmit = (values: OrderFormData) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Debe iniciar sesión." });
      return;
    }
    startTransition(async () => {
      let result;
      const submissionValues = {
        ...values,
        previousOrderId: values.previousOrderId?.trim() === "" ? undefined : values.previousOrderId?.trim()
      };

      if (orderId) {
        result = await updateOrder(orderId, submissionValues, user.uid);
      } else {
        result = await createOrder(submissionValues, user.uid);
      }

      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        if (result.order && result.order.id) {
            router.push(`/orders/${result.order.id}`);
        } else if (orderId) { // Fallback for update if order object isn't returned but was successful
             router.push(`/orders/${orderId}`);
        } else {
            toast({ variant: "destructive", title: "Error de Redirección", description: "No se pudo obtener el ID de la orden para redirigir." });
            router.push("/orders"); 
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
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

  if ((isLoadingOrder && orderId) || (isLoadingSettings && !orderId) ) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={48}/> <p className="ml-4">Cargando datos del formulario...</p></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="text-primary"/> Datos del Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="clientName" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Nombre" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="clientLastName" render={({ field }) => ( <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input placeholder="Apellido" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="clientDni" render={({ field }) => ( <FormItem><FormLabel>DNI</FormLabel><FormControl><Input placeholder="DNI" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="clientPhone" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Teléfono" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="clientEmail" render={({ field }) => ( <FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input type="email" placeholder="Email" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="text-primary"/> Detalles del Equipo y Falla</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="branchInfo" render={({ field }) => ( 
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><Building className="h-4 w-4"/>Sucursal/Taller</FormLabel>
                    <FormControl><Input placeholder="Nombre de la sucursal" {...field} disabled={isLoadingSettings} /></FormControl>
                    <FormDescription>Información de la sucursal donde se registra la orden.</FormDescription>
                    <FormMessage />
                  </FormItem> 
                )} />
                <FormField control={form.control} name="deviceBrand" render={({ field }) => ( <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ej: Samsung, Apple" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="deviceModel" render={({ field }) => ( <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ej: Galaxy S21, iPhone 13" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="deviceIMEI" render={({ field }) => ( <FormItem><FormLabel>IMEI</FormLabel><FormControl><Input placeholder="IMEI del equipo" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="declaredFault" render={({ field }) => ( <FormItem><FormLabel>Falla Declarada por el Cliente</FormLabel><FormControl><Textarea placeholder="Descripción de la falla" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="unlockPatternInfo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patrón o Clave de Desbloqueo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una opción" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {UNLOCK_PATTERN_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="text-primary"/> Riesgos y Sectores Específicos</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="damageRisk" render={({ field }) => ( <FormItem><FormLabel>Riesgo de Rotura (Daños preexistentes)</FormLabel><FormControl><Textarea placeholder="Describa daños específicos..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="specificSectors" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sectores Específicos (Marcar si aplica)</FormLabel>
                    {SPECIFIC_SECTORS_OPTIONS.map(sector => (
                      <FormField
                        key={sector}
                        control={form.control}
                        name="specificSectors"
                        render={({ field: subField }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                            <FormControl>
                              <Checkbox
                                checked={subField.value?.includes(sector)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? subField.onChange([...(subField.value || []), sector])
                                    : subField.onChange(subField.value?.filter(value => value !== sector));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">{sector}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )} />
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
                    <FormLabel>Clasificación</FormLabel>
                    <Select
                      onValueChange={(selectedValue) => field.onChange(selectedValue === NONE_CLASSIFICATION_VALUE ? "" : selectedValue)}
                      value={field.value === "" || field.value === undefined ? NONE_CLASSIFICATION_VALUE : field.value}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione clasificación" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={NONE_CLASSIFICATION_VALUE}>Ninguna</SelectItem>
                        {CLASSIFICATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccione estado" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {ORDER_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
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
          <CardHeader><CardTitle className="flex items-center gap-2"><Info className="text-primary"/> Observaciones y Aceptación</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="observations" render={({ field }) => ( <FormItem><FormLabel>Observaciones Adicionales</FormLabel><FormControl><Textarea placeholder="Comentarios o información relevante..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="customerSignatureName" render={({ field }) => ( <FormItem><FormLabel>Nombre del Cliente que Acepta</FormLabel><FormControl><Input placeholder="Nombre completo del cliente" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="customerAccepted" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aceptación del Cliente</FormLabel>
                  <FormDescription>El cliente acepta las condiciones del servicio y el estado de recepción del equipo.</FormDescription>
                   <FormMessage />
                </div>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={isPending || isAiLoading || isLoadingSettings}>
          {(isPending || isLoadingSettings) && <LoadingSpinner size={16} className="mr-2"/>}
          {orderId ? (isPending ? "Actualizando Orden..." : "Actualizar Orden") : (isPending || isLoadingSettings ? "Creando Orden..." : "Crear Orden de Servicio")}
        </Button>
      </form>
    </Form>
  );
}
