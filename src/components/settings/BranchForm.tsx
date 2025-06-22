// src/components/settings/BranchForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition, useEffect } from "react";
import type { z } from "zod";

import { BranchSchema, type BranchFormData } from "@/lib/schemas";
import { createBranch, updateBranch, getBranchById } from "@/lib/actions/branch.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Building, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BranchFormProps {
  branchId?: string;
  initialData?: Partial<BranchFormData>;
}

export function BranchForm({ branchId, initialData }: BranchFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BranchFormData>({
    resolver: zodResolver(BranchSchema),
    defaultValues: initialData || {
      name: "",
      address: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (branchId && !initialData) {
      getBranchById(branchId)
        .then(data => {
          if (data) {
            form.reset(data);
          } else {
            toast({ variant: "destructive", title: "Error", description: "Sucursal no encontrada." });
            router.push("/settings/branches");
          }
        });
    }
  }, [branchId, initialData, form, toast, router]);

  const onSubmit = (values: BranchFormData) => {
    startTransition(async () => {
      const result = branchId
        ? await updateBranch(branchId, values)
        : await createBranch(values);

      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        router.push("/settings/branches");
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>{branchId ? "Editar Sucursal" : "Nueva Sucursal"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><Building className="h-4 w-4" />Nombre de la Sucursal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Taller Central, Sucursal Norte" {...field} />
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
                  <FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4" />Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Av. Corrientes 1234, CABA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="active">Activa</SelectItem>
                            <SelectItem value="inactive">Inactiva</SelectItem>
                        </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending && <LoadingSpinner size={16} className="mr-2" />}
                {branchId ? "Guardar Cambios" : "Crear Sucursal"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
