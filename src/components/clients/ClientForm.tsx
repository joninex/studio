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
import { UserCircle, Phone, Mail, Home, Edit3, FileText } from "lucide-react";

interface ClientFormProps {
  clientId?: string;
  initialData?: Partial<ClientFormData>;
}

export function ClientForm({ clientId, initialData }: ClientFormProps) {
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
      email: "",
      address: "",
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
            router.push("/clients");
          }
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el cliente." });
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [clientId, initialData, form, toast, router]);

  const onSubmit = (values: ClientFormData) => {
    startTransition(async () => {
      if (clientId) {
        const result = await updateClient(clientId, values);
        if (result.success) {
          toast({ title: "Éxito", description: "Cliente actualizado correctamente." });
          router.push("/clients"); // Or to /clients/${clientId} when detail page exists
          router.refresh(); // Ensure the list is updated
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
        }
      } else {
        const result = await createClient(values);
        if (result.success && result.client?.id) {
          toast({ title: "Éxito", description: "Cliente creado correctamente." });
          router.push("/clients");
          router.refresh(); 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><UserCircle className="h-4 w-4" />Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><UserCircle className="h-4 w-4" />Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido del cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dni"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><FileText className="h-4 w-4" />DNI/Documento</FormLabel>
                <FormControl>
                  <Input placeholder="Número de DNI o documento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><Phone className="h-4 w-4" />Teléfono Principal</FormLabel>
                <FormControl>
                  <Input placeholder="Número de teléfono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4" />Email (Opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1"><Home className="h-4 w-4" />Dirección (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Calle, número, ciudad, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1"><Edit3 className="h-4 w-4" />Notas Internas (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Cualquier información adicional relevante sobre el cliente." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
