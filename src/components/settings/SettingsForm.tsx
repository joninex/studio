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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { getSettingsForBranch, updateSettingsForBranch } from "@/lib/actions/branch.actions";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { Building } from "lucide-react";


interface SettingsFormProps {
    branchId: string;
}

export function SettingsForm({ branchId }: SettingsFormProps) {
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
      if (!branchId) {
          setIsLoading(false); 
          return;
      }
      setIsLoading(true);
      try {
        const fetchedSettings = await getSettingsForBranch(branchId);
        form.reset({ 
          ...DEFAULT_STORE_SETTINGS, 
          ...fetchedSettings
        });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración de la sucursal."});
        form.reset({...DEFAULT_STORE_SETTINGS}); 
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [branchId, form, toast]);
  
  const onSubmit = (values: z.infer<typeof StoreSettingsSchema>) => {
    startTransition(async () => {
      const result = await updateSettingsForBranch(branchId, values);
      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        if (result.settings) {
            form.reset({
                ...DEFAULT_STORE_SETTINGS,
                ...result.settings,
            });
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><LoadingSpinner size={32}/> <p className="ml-2">Cargando configuración de sucursal...</p></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building className="text-primary"/>Datos de la Sucursal</CardTitle>
            <CardDescription>Información de la sucursal <span className="font-bold">{form.getValues("branchInfo")}</span> que aparecerá en comprobantes y comunicaciones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Nombre de la Tienda/Empresa</FormLabel><FormControl><Input placeholder="Nombre de su Taller" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyLogoUrl" render={({ field }) => ( <FormItem><FormLabel>URL del Logo</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/logo.png" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Ingrese la URL completa de una imagen para el logo.</FormDescription><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyCuit" render={({ field }) => ( <FormItem><FormLabel>CUIT/CUIL (Opcional)</FormLabel><FormControl><Input placeholder="Ej: 20-12345678-9" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyAddress" render={({ field }) => ( <FormItem><FormLabel>Dirección</FormLabel><FormControl><Textarea rows={2} placeholder="Dirección completa del taller" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyContactDetails" render={({ field }) => ( <FormItem><FormLabel>Información de Contacto (para impresiones)</FormLabel><FormControl><Textarea rows={3} placeholder="Teléfono, Email, WhatsApp, etc." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="branchInfo" render={({ field }) => ( <FormItem><FormLabel>Información de Sucursal/Taller (para órdenes)</FormLabel><FormControl><Input placeholder="Ej: Taller Central, Sucursal Norte" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este nombre se usará en las órdenes de servicio.</FormDescription><FormMessage /></FormItem> )} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Condiciones Generales (Textos Breves)</CardTitle>
            <CardDescription>Textos resumidos para ciertas secciones de los comprobantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="warrantyConditions" render={({ field }) => ( <FormItem><FormLabel>Condiciones Generales de Garantía (Texto breve para resumen)</FormLabel><FormControl><Textarea rows={3} placeholder="Texto general de garantía..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.warrantyConditions} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="pickupConditions" render={({ field }) => ( <FormItem><FormLabel>Condiciones Generales de Retiro (Texto breve)</FormLabel><FormControl><Textarea rows={3} placeholder="Texto general de condiciones de retiro..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.pickupConditions} /></FormControl><FormMessage /></FormItem> )} />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Textos Legales Detallados y Políticas</CardTitle>
            <CardDescription>Estos textos se mostrarán en los comprobantes impresos y el cliente deberá aceptarlos (si aplica) al crear la orden de ingreso. Serán "congelados" (snapshotted) en cada orden al momento de su creación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="unlockDisclaimerText" render={({ field }) => ( <FormItem><FormLabel>Advertencia Importante (Desbloqueo)</FormLabel><FormControl><Textarea rows={4} placeholder="IMPORTANTE: Si no se informa el patrón/clave..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.unlockDisclaimerText} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="abandonmentPolicyText" render={({ field }) => ( <FormItem><FormLabel>Política Detallada de Abandono de Equipo</FormLabel><FormControl><Textarea rows={5} placeholder="ABANDONO DEL EQUIPO: Pasados los X días..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyText} /></FormControl><FormMessage /></FormItem> )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="abandonmentPolicyDays30" render={({ field }) => ( <FormItem><FormLabel>Días para actualización de costo (Abandono)</FormLabel><FormControl><Input type="number" placeholder="30" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || null)} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="abandonmentPolicyDays60" render={({ field }) => ( <FormItem><FormLabel>Días para disposición final (Abandono)</FormLabel><FormControl><Input type="number" placeholder="60" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || null)} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="dataLossPolicyText" render={({ field }) => ( <FormItem><FormLabel>Política de Pérdida/Recuperación de Información y Privacidad</FormLabel><FormControl><Textarea rows={4} placeholder="PÉRDIDA DE INFORMACIÓN: JO-SERVICE NO se responsabiliza... El cliente autoriza el acceso al dispositivo..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.dataLossPolicyText} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="privacyPolicyText" render={({ field }) => ( <FormItem><FormLabel>Texto Adicional de Política de Privacidad (Opcional)</FormLabel><FormControl><Textarea rows={3} placeholder="Texto adicional sobre privacidad si es necesario..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.privacyPolicyText} /></FormControl><FormDescription>Complementa la política de pérdida de datos si necesita detallar más aspectos de privacidad.</FormDescription><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="untestedDevicePolicyText" render={({ field }) => ( <FormItem><FormLabel>Política para Equipos Sin Encender o Sin Clave</FormLabel><FormControl><Textarea rows={4} placeholder="EQUIPOS SIN ENCENDER O CON CLAVE/PATRÓN NO INFORMADO..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.untestedDevicePolicyText} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="budgetVariationText" render={({ field }) => ( <FormItem><FormLabel>Política sobre Variaciones de Presupuesto</FormLabel><FormControl><Textarea rows={4} placeholder="PRESUPUESTO: El presupuesto informado es una estimación..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.budgetVariationText} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="highRiskDeviceText" render={({ field }) => ( <FormItem><FormLabel>Política para Teléfonos con Riesgos Especiales</FormLabel><FormControl><Textarea rows={4} placeholder="TELÉFONOS CON RIESGOS: Equipos mojados, sulfatados..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.highRiskDeviceText} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="partialDamageDisplayText" render={({ field }) => ( <FormItem><FormLabel>Política para Pantallas con Daño Parcial</FormLabel><FormControl><Textarea rows={4} placeholder="PANTALLAS CON DAÑO PARCIAL: En equipos con pantallas parcialmente..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.partialDamageDisplayText} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="warrantyVoidConditionsText" render={({ field }) => ( <FormItem><FormLabel>Condiciones Detalladas de Anulación de Garantía</FormLabel><FormControl><Textarea rows={6} placeholder="ANULACIÓN DE GARANTÍA: La garantía quedará anulada por..." {...field} value={field.value ?? DEFAULT_STORE_SETTINGS.warrantyVoidConditionsText} /></FormControl><FormMessage /></FormItem> )} />
          </CardContent>
        </Card>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending || isLoading}>
          {isPending && <LoadingSpinner size={16} className="mr-2"/>}
          Guardar Configuración de Sucursal
        </Button>
      </form>
    </Form>
  );
}
