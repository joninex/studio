// src/components/clients/ClientListClient.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { Client } from "@/types";
import { getClients } from "@/lib/actions/client.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, FilterX, Search, Edit, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ClientListClientProps {
  initialClients: Client[]; 
  initialFilters: { name?: string, dni?: string };
}

export function ClientListClient({ initialClients, initialFilters }: ClientListClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    name: initialFilters.name || "", 
    dni: initialFilters.dni || "",
  });

  const fetchClientsInternal = useCallback(async (currentFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const fetchedClients = await getClients(currentFilters);
      setClients(fetchedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los clientes." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    setFilters({
      name: params.get('name') || '',
      dni: params.get('dni') || '',
    });
  }, [searchParams]);


  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const applyFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (filters.name) params.set('name', filters.name);
      if (filters.dni) params.set('dni', filters.dni);
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setFilters({ name: "", dni: "" });
      router.push(pathname);
    });
  };

  useEffect(() => {
    const currentFilters = {
        name: searchParams.get('name') || '',
        dni: searchParams.get('dni') || '',
    };
    fetchClientsInternal(currentFilters);
  }, [searchParams, fetchClientsInternal]);

  // Placeholder for delete functionality
  const handleDeleteClient = async (clientId: string) => {
    toast({ title: "Info", description: `Funcionalidad de eliminar cliente (ID: ${clientId}) no implementada.`});
    // Implement actual deletion logic here
    // Example:
    // if (confirm("¿Está seguro de que desea eliminar este cliente?")) {
    //   startTransition(async () => {
    //     const result = await deleteClientAction(clientId); // Assuming deleteClientAction exists
    //     if (result.success) {
    //       toast({ title: "Éxito", description: "Cliente eliminado." });
    //       fetchClientsInternal(filters); // Refresh list
    //     } else {
    //       toast({ variant: "destructive", title: "Error", description: result.message });
    //     }
    //   });
    // }
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>Filtros de Búsqueda de Clientes</CardTitle>
        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Nombre o Apellido"
            value={filters.name}
            onChange={(e) => handleFilterChange("name", e.target.value)}
          />
          <Input
            placeholder="DNI"
            value={filters.dni}
            onChange={(e) => handleFilterChange("dni", e.target.value)}
          />
          <div className="flex gap-2 lg:col-start-4">
            <Button onClick={applyFilters} disabled={isPending || isLoading} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
            <Button onClick={clearFilters} variant="outline" disabled={isPending || isLoading} className="w-full sm:w-auto">
              <FilterX className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner size={32}/>
            <p className="ml-2">Cargando clientes...</p>
          </div>
        )}
        {!isLoading && clients.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">
            No se encontraron clientes con los filtros aplicados.
          </div>
        )}
        {!isLoading && clients.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name} {client.lastName}</TableCell>
                    <TableCell>{client.dni}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.email || "N/A"}</TableCell>
                    <TableCell>
                      {client.createdAt ? format(new Date(client.createdAt as string), "dd MMM yyyy", { locale: es }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon" title="Editar Cliente">
                        <Link href={`/clients/${client.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                       <Button variant="ghost" size="icon" title="Eliminar Cliente (Próximamente)" onClick={() => handleDeleteClient(client.id)} className="cursor-not-allowed">
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
  );
}
