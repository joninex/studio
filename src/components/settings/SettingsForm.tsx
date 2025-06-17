// src/components/settings/SettingsForm.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { StoreSettings } from "@/types";
import { StoreSettingsSchema } from "@/lib/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { getStoreSettingsForUser, updateStoreSettingsForUser } from "@/lib/actions/settings.actions";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";


interface SettingsFormProps {
    userId: string;
}

export function SettingsForm({ userId }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof StoreSettingsSchema>>({
    resolver: zodResolver(StoreSettingsSchema),
    defaultValues: {
      ...DEFAULT_STORE_SETTINGS, 
    },
  });

  useEffect(() => {
    async function loadSettings() {
      if (!userId) {
          setIsLoading(false); 
          return;
      }
      setIsLoading(true);
      try {
        const fetchedSettings = await getStoreSettingsForUser(userId);
        form.reset({ 
          ...DEFAULT_STORE_SETTINGS, 
          ...fetchedSettings,
          abandonmentPolicyDays30: Number(fetchedSettings.abandonmentPolicyDays30 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays30),
          abandonmentPolicyDays60: Number(fetchedSettings.abandonmentPolicyDays60 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays60),
          dataLossDisclaimerText: fetchedSettings.dataLossDisclaimerText ?? DEFAULT_STORE_SETTINGS.dataLossDisclaimerText,
          privacyPolicyText: fetchedSettings.privacyPolicyText ?? DEFAULT_STORE_SETTINGS.privacyPolicyText,
          // Reset new legal text fields
          importantUnlockDisclaimer: fetchedSettings.importantUnlockDisclaimer ?? DEFAULT_STORE_SETTINGS.importantUnlockDisclaimer,
          abandonmentPolicyText: fetchedSettings.abandonmentPolicyText ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyText,
          dataRetrievalPolicyText: fetchedSettings.dataRetrievalPolicyText ?? DEFAULT_STORE_SETTINGS.dataRetrievalPolicyText,
          untestedDevicePolicyText: fetchedSettings.untestedDevicePolicyText ?? DEFAULT_STORE_SETTINGS.untestedDevicePolicyText,
          budgetVariationText: fetchedSettings.budgetVariationText ?? DEFAULT_STORE_SETTINGS.budgetVariationText,
          highRiskDeviceText: fetchedSettings.highRiskDeviceText ?? DEFAULT_STORE_SETTINGS.highRiskDeviceText,
          partialDamageDisplayText: fetchedSettings.partialDamageDisplayText ?? DEFAULT_STORE_SETTINGS.partialDamageDisplayText,
          warrantyVoidConditionsText: fetchedSettings.warrantyVoidConditionsText ?? DEFAULT_STORE_SETTINGS.warrantyVoidConditionsText,
        });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración de su tienda."});
        form.reset({...DEFAULT_STORE_SETTINGS}); 
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [userId, form, toast]);
  
  const onSubmit = (values: z.infer<typeof StoreSettingsSchema>) => {
    startTransition(async () => {
      const dataToSave: StoreSettings = { 
        ...values,
        abandonmentPolicyDays30: Number(values.abandonmentPolicyDays30),
        abandonmentPolicyDays60: Number(values.abandonmentPolicyDays60),
      };
      const result = await updateStoreSettingsForUser(userId, dataToSave);
      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        if (result.settings) {
            form.reset({
                ...DEFAULT_STORE_SETTINGS,
                ...result.settings,
                abandonmentPolicyDays30: Number(result.settings.abandonmentPolicyDays30),
                abandonmentPolicyDays60: Number(result.settings.abandonmentPolicyDays60),
                dataLossDisclaimerText: result.settings.dataLossDisclaimerText,
                privacyPolicyText: result.settings.privacyPolicyText,
                importantUnlockDisclaimer: result.settings.importantUnlockDisclaimer,
                abandonmentPolicyText: result.settings.abandonmentPolicyText,
                dataRetrievalPolicyText: result.settings.dataRetrievalPolicyText,
                untestedDevicePolicyText: result.settings.untestedDevicePolicyText,
                budgetVariationText: result.settings.budgetVariationText,
                highRiskDeviceText: result.settings.highRiskDeviceText,
                partialDamageDisplayText: result.settings.partialDamageDisplayText,
                warrantyVoidConditionsText: result.settings.warrantyVoidConditionsText,
            });
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><LoadingSpinner size={32}/> <p className="ml-2">Cargando configuración...</p></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-2">Datos de la Tienda y Sucursal</h3>
          <div className="space-y-4">
            <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Nombre de la Tienda/Empresa</FormLabel><FormControl><Input placeholder="Nombre de su Taller" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyLogoUrl" render={({ field }) => ( <FormItem><FormLabel>URL del Logo</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/logo.png" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Ingrese la URL completa de una imagen para el logo.</FormDescription><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyCuit" render={({ field }) => ( <FormItem><FormLabel>CUIT/CUIL (Opcional)</FormLabel><FormControl><Input placeholder="Ej: 20-12345678-9" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyAddress" render={({ field }) => ( <FormItem><FormLabel>Dirección</FormLabel><FormControl><Textarea rows={2} placeholder="Dirección completa del taller" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyContactDetails" render={({ field }) => ( <FormItem><FormLabel>Información de Contacto (para impresiones)</FormLabel><FormControl><Textarea rows={3} placeholder="Teléfono, Email, WhatsApp, etc." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="branchInfo" render={({ field }) => ( <FormItem><FormLabel>Información de Sucursal/Taller (para órdenes)</FormLabel><FormControl><Input placeholder="Ej: Taller Central, Sucursal Norte" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este nombre se usará en las órdenes de servicio.</FormDescription><FormMessage /></FormItem> )} />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-2">Políticas Generales y Descargos de Responsabilidad</h3>
          <div className="space-y-4">
            <FormField control={form.control} name="warrantyConditions" render={({ field }) => ( <FormItem><FormLabel>Condiciones Generales de Garantía (Texto breve)</FormLabel><FormControl><Textarea rows={3} placeholder="Texto general de garantía..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="pickupConditions" render={({ field }) => ( <FormItem><FormLabel>Condiciones Generales de Retiro (Texto breve)</FormLabel><FormControl><Textarea rows={3} placeholder="Texto general de condiciones de retiro..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={form.control} name="dataLossDisclaimerText" render={({ field }) => ( <FormItem><FormLabel>Descargo Estándar por Pérdida de Datos</FormLabel><FormControl><Textarea rows={3} placeholder="El cliente acepta que existe riesgo de pérdida de datos..." {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este texto se usará si no se especifica uno más detallado abajo.</FormDescription><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="privacyPolicyText" render={({ field }) => ( <FormItem><FormLabel>Política Estándar de Privacidad y Acceso al Dispositivo</FormLabel><FormControl><Textarea rows={3} placeholder="El cliente autoriza el acceso al dispositivo para fines de reparación..." {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este texto se usará si no se especifica uno más detallado abajo.</FormDescription><FormMessage /></FormItem> )} />
          </div>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-2">Textos Legales Detallados (Para Impresiones)</h3>
           <FormDescription className="mb-4">Estos textos se mostrarán en los comprobantes impresos y serán aceptados por el cliente al firmar la orden de ingreso.</FormDescription>
          <div className="space-y-4">
            <FormField control={form.control} name="importantUnlockDisclaimer" render={({ field }) => ( <FormItem><FormLabel>Advertencia Importante (Desbloqueo)</FormLabel><FormControl><Textarea rows={4} placeholder="IMPORTANTE: Si no se informa el patrón/clave..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="abandonmentPolicyText" render={({ field }) => ( <FormItem><FormLabel>Política Detallada de Abandono de Equipo</FormLabel><FormControl><Textarea rows={5} placeholder="ABANDONO DEL EQUIPO: Pasados los 30 días..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="abandonmentPolicyDays30" render={({ field }) => ( <FormItem><FormLabel>Días para actualización de costo (Abandono)</FormLabel><FormControl><Input type="number" placeholder="30" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || null)} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="abandonmentPolicyDays60" render={({ field }) => ( <FormItem><FormLabel>Días para disposición final (Abandono)</FormLabel><FormControl><Input type="number" placeholder="60" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || null)} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="dataRetrievalPolicyText" render={({ field }) => ( <FormItem><FormLabel>Política de Pérdida/Recuperación de Información</FormLabel><FormControl><Textarea rows={4} placeholder="PÉRDIDA DE INFORMACIÓN: TecnoLand NO se responsabiliza..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="untestedDevicePolicyText" render={({ field }) => ( <FormItem><FormLabel>Política para Equipos Sin Encender o Sin Clave</FormLabel><FormControl><Textarea rows={4} placeholder="EQUIPOS SIN ENCENDER O CON CLAVE/PATRÓN NO INFORMADO..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="budgetVariationText" render={({ field }) => ( <FormItem><FormLabel>Política sobre Variaciones de Presupuesto</FormLabel><FormControl><Textarea rows={4} placeholder="PRESUPUESTO: El presupuesto informado se basa..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="highRiskDeviceText" render={({ field }) => ( <FormItem><FormLabel>Política para Teléfonos con Riesgos Especiales</FormLabel><FormControl><Textarea rows={4} placeholder="TELÉFONOS CON RIESGOS: Equipos mojados, sulfatados..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="partialDamageDisplayText" render={({ field }) => ( <FormItem><FormLabel>Política para Pantallas con Daño Parcial</FormLabel><FormControl><Textarea rows={4} placeholder="PANTALLAS CON DAÑO PARCIAL: En equipos con pantallas parcialmente..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="warrantyVoidConditionsText" render={({ field }) => ( <FormItem><FormLabel>Condiciones Detalladas de Anulación de Garantía</FormLabel><FormControl><Textarea rows={6} placeholder="ANULACIÓN DE GARANTÍA: La garantía quedará anulada por..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
          </div>
        </div>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending || isLoading}>
          {isPending && <LoadingSpinner size={16} className="mr-2"/>}
          Guardar Configuración
        </Button>
      </form>
    </Form>
  );
}
