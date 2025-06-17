// src/components/clients/ClientForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { z } from "zod";

import { ClientSchema, type ClientFormData } from "@/lib/schemas";
import { createClient } // Potentially updateClient if editing later
  from "@/lib/actions/client.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { UserCircle, Phone, Mail, Home, Edit3, ShieldAlert, FileText } from "lucide-react";


// interface ClientFormProps {
//   clientId?: string; // For editing existing clients
//   initialData?: Partial<ClientFormData>;
// }

export function ClientForm(/* { clientId, initialData }: ClientFormProps */) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    defaultValues: /*initialData ||*/ {
      name: "",
      lastName: "",
      dni: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  const onSubmit = (values: ClientFormData) => {
    startTransition(async () => {
      // if (clientId) {
      //   // Update logic
      //   const result = await updateClient(clientId, values);
      //   if (result.success) {
      //     toast({ title: "Éxito", description: "Cliente actualizado correctamente." });
      //     router.push(`/clients/${clientId}`); // or /clients
      //   } else {
      //     toast({ variant: "destructive", title: "Error", description: result.message });
      //   }
      // } else {
        // Create logic
        const result = await createClient(values);
        if (result.success && result.client?.id) {
          toast({ title: "Éxito", description: "Cliente creado correctamente." });
          router.push("/clients"); // Navigate to client list after creation
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message || "No se pudo crear el cliente." });
        }
      // }
    });
  };

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
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending && <LoadingSpinner size={16} className="mr-2" />}
            {/* {clientId ? "Guardar Cambios" : "Crear Cliente"} */}
            Crear Cliente
          </Button>
        </div>
      </form>
    </Form>
  );
}
