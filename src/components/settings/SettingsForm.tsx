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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "../shared/LoadingSpinner";

// Mock server actions for settings
async function getSettingsMock(): Promise<Configurations> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: "general_config",
    warrantyConditions: "La garantía cubre la reparación por 90 días. No cubre otros daños.",
    pickupConditions: "Retirar equipo dentro de los 30 días. Luego se cobra almacenamiento.",
    contactInfo: "JO-SERVICE, Tel: 123-456789, Email: contacto@joservice.com.ar",
    abandonmentPolicyDays30: 30,
    abandonmentPolicyDays60: 60,
  };
}
async function updateSettingsMock(data: z.infer<typeof SettingsSchema>): Promise<{ success: boolean; message: string; settings?: Configurations }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log("Updating settings (mock):", data);
  // In a real app, update the 'general_config' document in Firestore
  return { success: true, message: "Configuración guardada exitosamente (mock).", settings: { id: "general_config", ...data } };
}

export function SettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      warrantyConditions: "",
      pickupConditions: "",
      contactInfo: "",
      abandonmentPolicyDays30: 30,
      abandonmentPolicyDays60: 60,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      const fetchedSettings = await getSettingsMock();
      form.reset({ // Ensure numbers are parsed correctly if they come as strings
        ...fetchedSettings,
        abandonmentPolicyDays30: Number(fetchedSettings.abandonmentPolicyDays30),
        abandonmentPolicyDays60: Number(fetchedSettings.abandonmentPolicyDays60),
      });
      setIsLoading(false);
    }
    loadSettings();
  }, [form]);
  
  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(async () => {
      // Ensure numeric fields are numbers
      const dataToSave = {
        ...values,
        abandonmentPolicyDays30: Number(values.abandonmentPolicyDays30),
        abandonmentPolicyDays60: Number(values.abandonmentPolicyDays60),
      };
      const result = await updateSettingsMock(dataToSave);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="warrantyConditions" render={({ field }) => ( <FormItem><FormLabel>Condiciones de Garantía</FormLabel><FormControl><Textarea rows={4} placeholder="Texto de garantía..." {...field} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={form.control} name="pickupConditions" render={({ field }) => ( <FormItem><FormLabel>Condiciones de Retiro</FormLabel><FormControl><Textarea rows={4} placeholder="Texto de condiciones de retiro..." {...field} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={form.control} name="contactInfo" render={({ field }) => ( <FormItem><FormLabel>Información de Contacto General</FormLabel><FormControl><Textarea rows={3} placeholder="Información de contacto..." {...field} /></FormControl><FormMessage /></FormItem> )} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="abandonmentPolicyDays30" render={({ field }) => ( <FormItem><FormLabel>Días para abandono (1er aviso)</FormLabel><FormControl><Input type="number" placeholder="30" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="abandonmentPolicyDays60" render={({ field }) => ( <FormItem><FormLabel>Días para abandono (final)</FormLabel><FormControl><Input type="number" placeholder="60" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem> )} />
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={isPending || isLoading}>
          {isPending && <LoadingSpinner size={16} className="mr-2"/>}
          Guardar Configuración
        </Button>
      </form>
    </Form>
  );
}
