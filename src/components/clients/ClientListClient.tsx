// src/components/clients/ClientListClient.tsx
"use client";

import { useState, useEffect, useTransition, useCallback, ChangeEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useDebounce } from "use-debounce";

import type { Client } from "@/types";
import { getClients } from "@/lib/actions/client.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, FilterX, Search, Edit, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ClientListClientProps {
  initialClients: Client[]; 
  initialFilters: { search?: string };
}

export function ClientListClient({ initialClients, initialFilters }: ClientListClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const fetchClientsInternal = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const fetchedClients = await getClients({ search: searchQuery });
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
    const currentSearch = params.get('search') || '';
    setSearchTerm(currentSearch);
    fetchClientsInternal(currentSearch);
  }, [searchParams, fetchClientsInternal]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm) {
        params.set('search', debouncedSearchTerm);
    } else {
        params.delete('search');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, pathname, router, searchParams]);


  const clearFilters = () => {
    setSearchTerm("");
  };

  const handleDeleteClient = async (clientId: string) => {
    toast({ title: "Info", description: `Funcionalidad de eliminar cliente (ID: ${clientId}) no implementada.`});
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>Búsqueda de Clientes</CardTitle>
        <CardDescription>Busque por nombre, apellido, DNI, CUIT, teléfono o email.</CardDescription>
        <div className="flex gap-4 pt-4">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <Button onClick={clearFilters} variant="outline" disabled={isLoading || !searchTerm}>
              <FilterX className="mr-2 h-4 w-4" /> Limpiar
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner size={32}/>
            <p className="ml-2">Buscando clientes...</p>
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
                  <TableHead>DNI / CUIT</TableHead>
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
                    <TableCell>
                      <div>{client.dni}</div>
                      {client.cuit && <div className="text-xs text-muted-foreground">{client.cuit}</div>}
                    </TableCell>
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
