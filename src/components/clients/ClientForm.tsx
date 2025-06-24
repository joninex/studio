// src/components/clients/ClientForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import type { z } from "zod";

import { ClientSchema, type ClientFormData } from "@/lib/schemas";
import { createClient, updateClient, getClientById } from "@/lib/actions/client.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { UserCircle, Phone, Mail, Home, Edit3, FileText, Building, Info } from "lucide-react";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FISCAL_CONDITIONS } from "@/lib/constants";
import type { Client, FiscalCondition } from "@/types";

interface ClientFormProps {
  clientId?: string;
  initialData?: Partial<ClientFormData>;
  onSuccess?: (client: Client) => void;
}

export function ClientForm({ clientId, initialData, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(!!clientId && !initialData);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    defaultValues: initialData || {
      name: "",
      lastName: "",
      dni: "",
      phone: "",
      phone2: "",
      email: "",
      address: "",
      businessName: "",
      cuit: "",
      fiscalCondition: "Consumidor Final",
      notes: "",
    },
  });

  useEffect(() => {
    if (clientId && !initialData) {
      setIsLoadingData(true);
      getClientById(clientId)
        .then(data => {
          if (data) {
            form.reset(data);
          } else {
            toast({ variant: "destructive", title: "Error", description: "Cliente no encontrado." });
            if (!onSuccess) router.push("/clients");
          }
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el cliente." });
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [clientId, initialData, form, toast, router, onSuccess]);

  const onSubmit = (values: ClientFormData) => {
    startTransition(async () => {
      if (clientId) {
        const result = await updateClient(clientId, values);
        if (result.success && result.client) {
          toast({ title: "Éxito", description: "Cliente actualizado correctamente." });
          if (onSuccess) {
            onSuccess(result.client);
          } else {
            router.push("/clients");
            router.refresh(); 
          }
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
        }
      } else {
        const result = await createClient(values);
        if (result.success && result.client) {
          toast({ title: "Éxito", description: "Cliente creado correctamente." });
          if (onSuccess) {
            onSuccess(result.client);
          } else {
            router.push("/clients");
            router.refresh(); 
          }
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message || "No se pudo crear el cliente." });
        }
      }
    });
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={32} />
        <p className="ml-2">Cargando datos del cliente...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <h3 className="text-lg font-medium flex items-center gap-2"><UserCircle className="text-primary"/>Datos Personales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Nombre del cliente" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input placeholder="Apellido del cliente" {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <FormField control={form.control} name="dni" render={({ field }) => ( <FormItem><FormLabel>DNI/Documento</FormLabel><FormControl><Input placeholder="Número de DNI o documento" {...field} /></FormControl><FormMessage /></FormItem> )} />
        
        <Separator className="my-6"/>

        <h3 className="text-lg font-medium flex items-center gap-2"><Phone className="text-primary"/>Datos de Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Teléfono Principal</FormLabel><FormControl><Input placeholder="Número de teléfono principal" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="phone2" render={({ field }) => ( <FormItem><FormLabel>Teléfono Alternativo (Opcional)</FormLabel><FormControl><Input placeholder="Otro número de contacto" {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input type="email" placeholder="correo@ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Dirección (Opcional)</FormLabel><FormControl><Textarea placeholder="Calle, número, ciudad, etc." {...field} /></FormControl><FormMessage /></FormItem> )} />

        <Separator className="my-6" />

        <h3 className="text-lg font-medium flex items-center gap-2"><Building className="text-primary"/>Información Fiscal (Opcional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem><FormLabel>Razón Social</FormLabel><FormControl><Input placeholder="Nombre de la empresa o negocio" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="cuit" render={({ field }) => ( <FormItem><FormLabel>CUIT</FormLabel><FormControl><Input placeholder="Número de CUIT" {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <FormField
          control={form.control}
          name="fiscalCondition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condición Fiscal</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione condición fiscal..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FISCAL_CONDITIONS.map((fc) => (
                    <SelectItem key={fc} value={fc}>
                      {fc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-6" />
        
        <h3 className="text-lg font-medium flex items-center gap-2"><Info className="text-primary"/>Información Adicional</h3>
        <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notas Internas (Opcional)</FormLabel><FormControl><Textarea placeholder="Cualquier información adicional relevante sobre el cliente." {...field} /></FormControl><FormMessage /></FormItem> )} />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending || isLoadingData} className="w-full sm:w-auto">
            {(isPending || isLoadingData) && <LoadingSpinner size={16} className="mr-2" />}
            {clientId ? "Guardar Cambios" : "Crear Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
