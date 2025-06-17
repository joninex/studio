// src/components/inventory/SupplierForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import type { z } from "zod";

import { SupplierSchema, type SupplierFormData } from "@/lib/schemas";
import { createSupplier, updateSupplier, getSupplierById } from "@/lib/actions/supplier.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Truck, User, Phone, Mail, Home, FileText, Edit3 } from "lucide-react";

interface SupplierFormProps {
  supplierId?: string;
  initialData?: Partial<SupplierFormData>;
}

export function SupplierForm({ supplierId, initialData }: SupplierFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(!!supplierId && !initialData);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: initialData || {
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      cuit: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (supplierId && !initialData) {
      setIsLoadingData(true);
      getSupplierById(supplierId)
        .then(data => {
          if (data) {
            form.reset(data);
          } else {
            toast({ variant: "destructive", title: "Error", description: "Proveedor no encontrado." });
            router.push("/inventory/suppliers");
          }
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el proveedor." });
        })
        .finally(() => setIsLoadingData(false));
    } else if (initialData) {
      form.reset(initialData);
    }
  }, [supplierId, initialData, form, toast, router]);

  const onSubmit = (values: SupplierFormData) => {
    startTransition(async () => {
      if (supplierId) {
        const result = await updateSupplier(supplierId, values);
        if (result.success) {
          toast({ title: "Éxito", description: "Proveedor actualizado correctamente." });
          router.push("/inventory/suppliers");
          router.refresh(); 
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
        }
      } else {
        const result = await createSupplier(values);
        if (result.success && result.supplier?.id) {
          toast({ title: "Éxito", description: "Proveedor creado correctamente." });
          router.push("/inventory/suppliers");
          router.refresh();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message || "No se pudo crear el proveedor." });
        }
      }
    });
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={32} />
        <p className="ml-2">Cargando datos del proveedor...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Truck className="h-6 w-6 text-primary"/>
                {supplierId ? `Editando Proveedor: ${form.getValues("name") || ""}` : "Nuevo Proveedor"}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><Truck className="h-4 w-4"/>Nombre del Proveedor</FormLabel><FormControl><Input placeholder="Nombre comercial del proveedor" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="contactName" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><User className="h-4 w-4"/>Nombre de Contacto</FormLabel><FormControl><Input placeholder="Persona de contacto (Opcional)" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><Phone className="h-4 w-4"/>Teléfono</FormLabel><FormControl><Input placeholder="Número de teléfono (para WhatsApp usar formato internacional ej: 549...)" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4"/>Email</FormLabel><FormControl><Input type="email" placeholder="correo@proveedor.com (Opcional)" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            
            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><Home className="h-4 w-4"/>Dirección</FormLabel><FormControl><Textarea placeholder="Dirección del proveedor (Opcional)" {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="cuit" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><FileText className="h-4 w-4"/>CUIT/Identificación Fiscal</FormLabel><FormControl><Input placeholder="Número de CUIT (Opcional)" {...field} /></FormControl><FormMessage /></FormItem> )} />

            <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><Edit3 className="h-4 w-4"/>Notas Internas</FormLabel><FormControl><Textarea placeholder="Cualquier información adicional relevante sobre el proveedor (Opcional)" {...field} /></FormControl><FormMessage /></FormItem> )} />

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending || isLoadingData} className="w-full sm:w-auto">
                {(isPending || isLoadingData) && <LoadingSpinner size={16} className="mr-2" />}
                {supplierId ? "Guardar Cambios" : "Crear Proveedor"}
                </Button>
            </div>
            </form>
        </CardContent>
      </Card>
    </Form>
  );
}
