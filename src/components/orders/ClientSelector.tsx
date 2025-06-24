// src/components/orders/ClientSelector.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Client } from "@/types";
import { getClients } from "@/lib/actions/client.actions";
import { useDebounce } from "use-debounce";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Button } from "../ui/button";

interface ClientSelectorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectClient: (client: Client) => void;
}

export function ClientSelector({ isOpen, onOpenChange, onSelectClient }: ClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await getClients({ search: debouncedSearchTerm });
      setClients(results);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen, fetchClients]);

  const handleSelect = (client: Client) => {
    onSelectClient(client);
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Cliente</DialogTitle>
          <DialogDescription>Busque un cliente existente por nombre, DNI o email.</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} className="mt-4">
          <CommandInput 
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Buscar cliente..."
          />
          <CommandList>
            {isLoading && <div className="p-4 text-center text-sm flex justify-center items-center"><LoadingSpinner /><span className="ml-2">Buscando...</span></div>}
            {!isLoading && clients.length === 0 && (
                <CommandEmpty>
                    <div className="text-center py-4">
                        <p>No se encontraron clientes.</p>
                        <Button variant="link" asChild className="mt-2">
                           <Link href="/clients/new" target="_blank">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Nuevo Cliente
                            </Link>
                        </Button>
                    </div>
                </CommandEmpty>
            )}
            {!isLoading && (
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    onSelect={() => handleSelect(client)}
                    value={`${client.name} ${client.lastName}`}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{client.name} {client.lastName}</p>
                      <p className="text-xs text-muted-foreground">DNI: {client.dni}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm">{client.phone}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
