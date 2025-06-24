// src/components/inventory/PartListClient.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import type { Part, PartCategory } from "@/types";
import { getParts, deletePart } from "@/lib/actions/part.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Search, FilterX, PackagePlus, Eye } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PART_CATEGORIES } from "@/lib/constants";

const validCategoryOptions = PART_CATEGORIES;

interface PartListClientProps {
  initialParts: Part[]; 
  initialFilters: { name?: string, sku?: string, category?: string };
}

export function PartListClient({ initialParts, initialFilters }: PartListClientProps) {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);

  const [filters, setFilters] = useState({
    name: initialFilters.name || "", 
    sku: initialFilters.sku || "",
    category: initialFilters.category || "",
  });

  const fetchPartsInternal = useCallback(async (currentFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const fetchedParts = await getParts(currentFilters);
      setParts(fetchedParts);
    } catch (error) {
      console.error("Error fetching parts:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los repuestos." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    setFilters({
      name: params.get('name') || '',
      sku: params.get('sku') || '',
      category: params.get('category') || '',
    });
  }, [searchParams]);


  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
      setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.sku) params.set('sku', filters.sku);
    if (filters.category) params.set('category', filters.category);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({ name: "", sku: "", category: "" });
    router.push(pathname);
  };

  useEffect(() => {
    const currentFiltersOnParams = {
        name: searchParams.get('name') || '',
        sku: searchParams.get('sku') || '',
        category: searchParams.get('category') || '',
    };
    fetchPartsInternal(currentFiltersOnParams);
  }, [searchParams, fetchPartsInternal]);

  const handleDeletePart = () => {
    if (!partToDelete) return;
    startDeleteTransition(async () => {
      const result = await deletePart(partToDelete.id);
      if (result.success) {
        toast({ title: "Éxito", description: "Repuesto eliminado." });
        fetchPartsInternal(filters); // Refresh list
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setPartToDelete(null); 
    });
  };

  return (
    <>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda de Repuestos</CardTitle>
          <CardDescription>Encuentre repuestos por nombre, SKU o categoría.</CardDescription>
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Input
              placeholder="Nombre del repuesto"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
            />
            <Input
              placeholder="SKU / Código"
              value={filters.sku}
              onChange={(e) => handleFilterChange("sku", e.target.value)}
            />
            <Select value={filters.category ?? ""} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger>
                <SelectValue placeholder="Todas las Categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las Categorías</SelectItem>
                  {validCategoryOptions.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
            </Select>
            <div className="flex gap-2 lg:col-start-5">
              <Button onClick={applyFilters} disabled={isLoading} className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
              <Button onClick={clearFilters} variant="outline" disabled={isLoading} className="w-full sm:w-auto">
                <FilterX className="mr-2 h-4 w-4" /> Limpiar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size={32}/>
              <p className="ml-2">Cargando repuestos...</p>
            </div>
          )}
          {!isLoading && parts.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              No se encontraron repuestos con los filtros aplicados.
            </div>
          )}
          {!isLoading && parts.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Venta</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>
                        <Image 
                            src={part.imageUrl || "https://placehold.co/60x60.png?text=N/A"} 
                            alt={part.name}
                            width={60}
                            height={60}
                            className="rounded-md object-contain border"
                            data-ai-hint="part item image"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell>{part.sku || "N/A"}</TableCell>
                      <TableCell>{part.category || "Sin categoría"}</TableCell>
                      <TableCell className="text-right">${part.costPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${part.salePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={part.stock <= (part.minStock || 0) ? "destructive" : "outline"}>
                          {part.stock} {part.unit || "un."}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" title="Editar Repuesto">
                          <Link href={`/inventory/parts/${part.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                         <Button variant="ghost" size="icon" title="Eliminar Repuesto" onClick={() => setPartToDelete(part)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!partToDelete} onOpenChange={(open) => !open && setPartToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este repuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el repuesto: <br />
              <strong>{partToDelete?.name} (SKU: {partToDelete?.sku || 'N/A'})</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPartToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePart} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <LoadingSpinner size={16} className="mr-2"/>}
              Sí, eliminar repuesto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
