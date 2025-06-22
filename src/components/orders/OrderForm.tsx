// src/components/orders/OrderForm.tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import type { z } from "zod";

import { OrderSchema, type OrderFormData } from "@/lib/schemas";
import { createOrder, getRepairSuggestions, updateOrder, getOrderById } from "@/lib/actions/order.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { AISuggestion, type Order } from "@/types";
import { CHECKLIST_ITEMS, YES_NO_OPTIONS } from "@/lib/constants";
import { AlertCircle, Bot, DollarSign, Info, ListChecks, LucideSparkles, User, Wrench, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";


interface OrderFormProps {
  orderId?: string;
}

export function OrderForm({ orderId }: OrderFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(!!orderId);

  const currentBranchId = user?.role === 'admin' ? 'B001' : user?.assignments?.[0]?.branchId;

  const defaultChecklistValues = CHECKLIST_ITEMS.reduce((acc, item) => {
    (acc as any)[item.id] = item.type === 'boolean' ? 'no' : '';
    return acc;
  }, {} as OrderFormData['checklist']);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      branchId: currentBranchId || "",
      clientId: "", deviceBrand: "", deviceModel: "", deviceIMEI: "", declaredFault: "",
      checklist: defaultChecklistValues,
      damageRisk: "", costSparePart: 0, costLabor: 0,
      observations: "",
      estimatedCompletionTime: "",
    },
  });

  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      getOrderById(orderId)
        .then(data => {
          if (data) {
            form.reset(data);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
        if(currentBranchId) {
            form.setValue('branchId', currentBranchId);
        }
    }
  }, [orderId, form, currentBranchId]);

  const onSubmit = (values: OrderFormData) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Debe iniciar sesión." });
      return;
    }
    const userBranchContext = user?.role === 'admin' ? values.branchId : user?.assignments?.[0]?.branchId;
    if (!userBranchContext) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo determinar su sucursal. Contacte al administrador." });
        return;
    }

    startTransition(async () => {
      let result;
      if (orderId) {
        result = await updateOrder(orderId, values, user.uid);
      } else {
        result = await createOrder(values, user.uid, userBranchContext);
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={48}/> <p className="ml-4">Cargando orden...</p></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="branchId" render={({ field }) => ( <FormItem className="hidden"><FormControl><Input type="hidden" {...field} /></FormControl><FormMessage /></FormItem> )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="text-primary"/> Datos del Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <FormField control={form.control} name="clientId" render={({ field }) => ( <FormItem><FormLabel>ID del Cliente</FormLabel><FormControl><Input placeholder="Ej: CLI001" {...field} /></FormControl><FormDescription>Ingrese el ID de un cliente existente.</FormDescription><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="text-primary"/> Detalles del Equipo y Falla</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="deviceBrand" render={({ field }) => ( <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ej: Samsung, Apple" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="deviceModel" render={({ field }) => ( <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ej: Galaxy S21, iPhone 13" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="deviceIMEI" render={({ field }) => ( <FormItem><FormLabel>IMEI/Serial</FormLabel><FormControl><Input placeholder="IMEI o N° Serie del equipo" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="declaredFault" render={({ field }) => ( <FormItem><FormLabel>Falla Declarada por el Cliente</FormLabel><FormControl><Textarea placeholder="Descripción de la falla" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><LucideSparkles className="text-primary"/> Asistente IA de Diagnóstico</CardTitle>
                 <Button type="button" size="sm" onClick={handleGetAiSuggestions} disabled={isAiLoading}>
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
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="text-primary"/> Checklist de Recepción</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {CHECKLIST_ITEMS.map(item => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`checklist.${item.id as keyof OrderFormData['checklist']}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                        <FormControl>
                          {item.type === 'boolean' ? (
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value as string} className="flex space-x-2">
                              {YES_NO_OPTIONS.map(opt => (
                                <FormItem key={opt.value} className="flex items-center space-x-1 space-y-0">
                                  <FormControl><RadioGroupItem value={opt.value} /></FormControl>
                                  <FormLabel className="font-normal text-xs">{opt.label}</FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          ) : (
                            <Input type="text" {...field} className="h-8 text-xs w-20"/>
                          )}
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="text-primary"/> Riesgos y Observaciones</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="damageRisk" render={({ field }) => ( <FormItem><FormLabel>Riesgo de Rotura (Daños preexistentes)</FormLabel><FormControl><Textarea placeholder="Describa daños específicos..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="observations" render={({ field }) => ( <FormItem><FormLabel>Observaciones Adicionales</FormLabel><FormControl><Textarea placeholder="Comentarios o información relevante para la orden..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="estimatedCompletionTime" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><Clock className="h-4 w-4"/>Hora Estimada de Finalización</FormLabel><FormControl><Input placeholder="Ej: 18:00hs, Fin del día" {...field} /></FormControl><FormDescription>Esta hora se usará en las notificaciones al cliente.</FormDescription><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-primary"/> Costos Iniciales</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="costSparePart" render={({ field }) => ( <FormItem><FormLabel>Repuesto ($)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="costLabor" render={({ field }) => ( <FormItem><FormLabel>Mano de Obra ($)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto" disabled={isPending || isAiLoading || isLoading}>
            {(isPending || isLoading) && <LoadingSpinner size={16} className="mr-2"/>}
            {orderId ? "Actualizar Orden" : "Crear Orden de Servicio"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
