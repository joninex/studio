// src/components/settings/SettingsForm.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Configurations } from "@/types";
import { SettingsSchema } from "@/lib/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { getSettings, updateSettings } from "@/lib/actions/settings.actions";
import { Separator } from "@/components/ui/separator";

export function SettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      companyName: "",
      companyLogoUrl: "",
      companyCuit: "",
      companyAddress: "",
      companyContactDetails: "",
      branchInfo: "",
      warrantyConditions: "",
      pickupConditions: "",
      abandonmentPolicyDays30: 30,
      abandonmentPolicyDays60: 60,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const fetchedSettings = await getSettings();
        form.reset({ 
          ...fetchedSettings,
          abandonmentPolicyDays30: Number(fetchedSettings.abandonmentPolicyDays30),
          abandonmentPolicyDays60: Number(fetchedSettings.abandonmentPolicyDays60),
        });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración."});
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [form, toast]);
  
  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(async () => {
      const dataToSave = {
        ...values,
        abandonmentPolicyDays30: Number(values.abandonmentPolicyDays30),
        abandonmentPolicyDays60: Number(values.abandonmentPolicyDays60),
      };
      const result = await updateSettings(dataToSave);
      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        if (result.settings) form.reset(result.settings);
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
          <h3 className="text-lg font-medium mb-2">Datos de la Empresa y Sucursal</h3>
          <div className="space-y-4">
            <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input placeholder="Nombre de su Taller" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyLogoUrl" render={({ field }) => ( <FormItem><FormLabel>URL del Logo</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/logo.png" {...field} /></FormControl><FormDescription>Ingrese la URL completa de una imagen para el logo.</FormDescription><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyCuit" render={({ field }) => ( <FormItem><FormLabel>CUIT/CUIL (Opcional)</FormLabel><FormControl><Input placeholder="Ej: 20-12345678-9" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyAddress" render={({ field }) => ( <FormItem><FormLabel>Dirección</FormLabel><FormControl><Textarea rows={2} placeholder="Dirección completa del taller" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="companyContactDetails" render={({ field }) => ( <FormItem><FormLabel>Información de Contacto (para impresiones)</FormLabel><FormControl><Textarea rows={3} placeholder="Teléfono, Email, etc." {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="branchInfo" render={({ field }) => ( <FormItem><FormLabel>Información de Sucursal/Taller (para órdenes)</FormLabel><FormControl><Input placeholder="Ej: Taller Central, Sucursal Norte" {...field} /></FormControl><FormDescription>Este nombre se usará en las órdenes de servicio.</FormDescription><FormMessage /></FormItem> )} />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-2">Textos Legales y Políticas</h3>
          <div className="space-y-4">
            <FormField control={form.control} name="warrantyConditions" render={({ field }) => ( <FormItem><FormLabel>Condiciones de Garantía</FormLabel><FormControl><Textarea rows={4} placeholder="Texto de garantía..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="pickupConditions" render={({ field }) => ( <FormItem><FormLabel>Condiciones de Retiro</FormLabel><FormControl><Textarea rows={4} placeholder="Texto de condiciones de retiro..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="abandonmentPolicyDays30" render={({ field }) => ( <FormItem><FormLabel>Días para abandono (1er aviso)</FormLabel><FormControl><Input type="number" placeholder="30" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="abandonmentPolicyDays60" render={({ field }) => ( <FormItem><FormLabel>Días para abandono (final)</FormLabel><FormControl><Input type="number" placeholder="60" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem> )} />
            </div>
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
