// src/components/inventory/PartForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import type { z } from "zod";
import Image from "next/image";

import { PartSchema, type PartFormData } from "@/lib/schemas";
import { createPart, updatePart, getPartById } from "@/lib/actions/part.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Package, ScanLine, DollarSign, Shapes, Tag, ClipboardList, Info, ImageIcon } from "lucide-react";
import { PART_CATEGORIES, PART_UNITS } from "@/lib/constants";
import type { PartCategory, PartUnit } from "@/types";

interface PartFormProps {
  partId?: string;
  initialData?: Partial<PartFormData>;
}

export function PartForm({ partId, initialData }: PartFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(!!partId && !initialData);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);

  const form = useForm<PartFormData>({
    resolver: zodResolver(PartSchema),
    defaultValues: initialData || {
      name: "",
      sku: "",
      description: "",
      category: undefined, // Initially no category selected
      unit: "unidad",
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 0,
      supplierInfo: "",
      notes: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (partId && !initialData) {
      setIsLoadingData(true);
      getPartById(partId)
        .then(data => {
          if (data) {
            form.reset({
              ...data,
              category: data.category || undefined, // Ensure empty string becomes undefined for select
            });
            if(data.imageUrl) setImagePreview(data.imageUrl);
          } else {
            toast({ variant: "destructive", title: "Error", description: "Repuesto no encontrado." });
            router.push("/inventory/parts");
          }
        })
        .catch(() => {
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el repuesto." });
        })
        .finally(() => setIsLoadingData(false));
    } else if (initialData) {
        form.reset({
            ...initialData,
            category: initialData.category || undefined,
        });
        if(initialData.imageUrl) setImagePreview(initialData.imageUrl);
    }
  }, [partId, initialData, form, toast, router]);

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("imageUrl", url);
    if (PartSchema.shape.imageUrl.safeParse(url).success) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit = (values: PartFormData) => {
    startTransition(async () => {
      if (partId) {
        const result = await updatePart(partId, values);
        if (result.success) {
          toast({ title: "Éxito", description: "Repuesto actualizado correctamente." });
          router.push("/inventory/parts");
          router.refresh(); 
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
        }
      } else {
        const result = await createPart(values);
        if (result.success && result.part?.id) {
          toast({ title: "Éxito", description: "Repuesto creado correctamente." });
          router.push("/inventory/parts");
          router.refresh();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.message || "No se pudo crear el repuesto." });
        }
      }
    });
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={32} />
        <p className="ml-2">Cargando datos del repuesto...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Package className="text-primary"/> Información Principal</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><Tag className="h-4 w-4"/>Nombre del Repuesto</FormLabel><FormControl><Input placeholder="Ej: Pantalla iPhone 13, Batería S20" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="sku" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><ScanLine className="h-4 w-4"/>SKU / Código</FormLabel><FormControl><Input placeholder="Código interno o de barras" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><ClipboardList className="h-4 w-4"/>Descripción</FormLabel><FormControl><Textarea placeholder="Detalles adicionales del repuesto..." {...field} /></FormControl><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="text-primary"/> Imagen del Repuesto</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="imageUrl" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>URL de la Imagen</FormLabel>
                        <FormControl><Input type="url" placeholder="https://ejemplo.com/imagen.png" value={field.value || ""} onChange={handleImageUrlChange} /></FormControl>
                        <FormDescription>Enlace directo a una imagen del repuesto.</FormDescription>
                        <FormMessage />
                    </FormItem> 
                )} />
                {imagePreview && (
                    <div className="mt-2">
                        <Image 
                            src={imagePreview} 
                            alt="Vista previa del repuesto" 
                            width={150} 
                            height={150} 
                            className="rounded-md border object-contain"
                            data-ai-hint="part image"
                            onError={() => setImagePreview("https://placehold.co/150x150.png?text=Error")} // Fallback for broken links
                        />
                    </div>
                )}
                 {!imagePreview && (
                    <div className="mt-2">
                         <Image 
                            src="https://placehold.co/150x150.png?text=Repuesto"
                            alt="Placeholder de repuesto" 
                            width={150} 
                            height={150} 
                            className="rounded-md border object-contain"
                            data-ai-hint="part placeholder"
                        />
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shapes className="text-primary"/> Categorización y Unidades</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione categoría..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PART_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="unit" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Unidad de Medida</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "unidad"}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione unidad..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {PART_UNITS.map(unit => (
                                    <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem> 
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-primary"/> Precios y Stock</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="costPrice" render={({ field }) => ( <FormItem><FormLabel>Precio de Costo</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="salePrice" render={({ field }) => ( <FormItem><FormLabel>Precio de Venta</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="stock" render={({ field }) => ( <FormItem><FormLabel>Stock Actual</FormLabel><FormControl><Input type="number" step="1" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="minStock" render={({ field }) => ( <FormItem><FormLabel>Stock Mínimo (Opcional)</FormLabel><FormControl><Input type="number" step="1" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Info className="text-primary"/> Información Adicional</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <FormField control={form.control} name="supplierInfo" render={({ field }) => ( <FormItem><FormLabel>Información del Proveedor</FormLabel><FormControl><Input placeholder="Nombre o ID del proveedor" {...field} /></FormControl><FormDescription>Próximamente: selección de proveedor existente.</FormDescription><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notas Internas</FormLabel><FormControl><Textarea placeholder="Cualquier nota adicional sobre el repuesto..." {...field} /></FormControl><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending || isLoadingData} className="w-full sm:w-auto">
            {(isPending || isLoadingData) && <LoadingSpinner size={16} className="mr-2" />}
            {partId ? "Guardar Cambios" : "Crear Repuesto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
