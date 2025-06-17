// src/components/inventory/SupplierListClient.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { Supplier } from "@/types";
import { getSuppliers, deleteSupplier } from "@/lib/actions/supplier.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Search, FilterX, MessageSquare, UserPlus, Info, Home } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface SupplierListClientProps {
  initialSuppliers: Supplier[]; 
  initialFilters: { name?: string, contactName?: string };
}

export function SupplierListClient({ initialSuppliers, initialFilters }: SupplierListClientProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [filters, setFilters] = useState({
    name: initialFilters.name || "", 
    contactName: initialFilters.contactName || "",
  });

  const fetchSuppliersInternal = useCallback(async (currentFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const fetchedSuppliers = await getSuppliers(currentFilters);
      setSuppliers(fetchedSuppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los proveedores." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    setFilters({
      name: params.get('name') || '',
      contactName: params.get('contactName') || '',
    });
  }, [searchParams]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.contactName) params.set('contactName', filters.contactName);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({ name: "", contactName: "" });
    router.push(pathname);
  };

  useEffect(() => {
    const currentFiltersOnParams = {
      name: searchParams.get('name') || '',
      contactName: searchParams.get('contactName') || '',
    };
    fetchSuppliersInternal(currentFiltersOnParams);
  }, [searchParams, fetchSuppliersInternal]);

  const handleDeleteSupplier = () => {
    if (!supplierToDelete) return;
    startDeleteTransition(async () => {
      const result = await deleteSupplier(supplierToDelete.id);
      if (result.success) {
        toast({ title: "Éxito", description: "Proveedor eliminado." });
        fetchSuppliersInternal(filters); // Refresh list
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setSupplierToDelete(null); 
    });
  };

  const openWhatsApp = (supplier: Supplier) => {
    if (!supplier.phone) {
      toast({ variant: "destructive", title: "Error", description: "El proveedor no tiene un número de teléfono registrado." });
      return;
    }
    const cleanedPhone = supplier.phone.replace(/[\s+()-]/g, '');
    const message = `Hola ${supplier.name}, quisiera hacer una consulta sobre repuestos.`;
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda de Proveedores</CardTitle>
          <CardDescription>Encuentre proveedores por nombre o contacto.</CardDescription>
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Input
              placeholder="Nombre del proveedor"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
            />
            <Input
              placeholder="Nombre de contacto"
              value={filters.contactName}
              onChange={(e) => handleFilterChange("contactName", e.target.value)}
            />
            <div className="flex gap-2 lg:col-start-4">
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
              <p className="ml-2">Cargando proveedores...</p>
            </div>
          )}
          {!isLoading && suppliers.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              No se encontraron proveedores con los filtros aplicados.
            </div>
          )}
          {!isLoading && suppliers.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Proveedor</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead><Info className="inline-block mr-1 h-4 w-4"/>Qué Vende</TableHead>
                    <TableHead><Home className="inline-block mr-1 h-4 w-4"/>Dirección</TableHead>
                    <TableHead>Registrado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contactName || "N/A"}</TableCell>
                      <TableCell>
                        {supplier.phone || "N/A"}
                        {supplier.phone && (
                           <Button variant="ghost" size="icon" onClick={() => openWhatsApp(supplier)} title="Contactar por WhatsApp" className="ml-2 text-green-600 hover:text-green-700">
                             <MessageSquare className="h-4 w-4"/>
                           </Button>
                        )}
                      </TableCell>
                      <TableCell>{supplier.email || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">{supplier.sellsDescription || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">{supplier.address || "N/A"}</TableCell>
                      <TableCell>
                        {supplier.createdAt ? format(new Date(supplier.createdAt as string), "dd MMM yyyy", { locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" title="Editar Proveedor">
                          <Link href={`/inventory/suppliers/${supplier.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                         <Button variant="ghost" size="icon" title="Eliminar Proveedor" onClick={() => setSupplierToDelete(supplier)}>
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

      <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor: <br />
              <strong>{supplierToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <LoadingSpinner size={16} className="mr-2"/>}
              Sí, eliminar proveedor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
