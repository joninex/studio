// src/components/orders/PartSelector.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Part } from "@/types";
import { getParts } from "@/lib/actions/part.actions";
import { useDebounce } from "use-debounce";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "../shared/LoadingSpinner";

interface PartSelectorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectPart: (part: Part) => void;
  currentParts: string[]; // IDs of parts already in the order
}

export function PartSelector({ isOpen, onOpenChange, onSelectPart, currentParts }: PartSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchParts = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await getParts({ name: debouncedSearchTerm });
      // Filter out parts that are already in the order
      const availableParts = results.filter(part => !currentParts.includes(part.id));
      setParts(availableParts);
    } catch (error) {
      console.error("Failed to fetch parts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, currentParts]);

  useEffect(() => {
    if (isOpen) {
      fetchParts();
    } else {
      // Cleanup when the dialog is closed to prevent showing stale data
      setParts([]);
      setSearchTerm("");
    }
  }, [isOpen, fetchParts]);

  const handleSelect = (part: Part) => {
    onSelectPart(part);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Repuesto</DialogTitle>
          <DialogDescription>Busque un repuesto por nombre para agregarlo a la orden.</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} className="mt-4">
          <CommandInput 
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Buscar repuesto..."
          />
          <CommandList>
            {isLoading && <div className="p-4 text-center text-sm flex justify-center items-center"><LoadingSpinner /><span className="ml-2">Buscando...</span></div>}
            {!isLoading && parts.length === 0 && <CommandEmpty>No se encontraron repuestos.</CommandEmpty>}
            {!isLoading && (
              <CommandGroup>
                {parts.map((part) => (
                  <CommandItem
                    key={part.id}
                    onSelect={() => handleSelect(part)}
                    value={part.name}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{part.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {part.sku || "N/A"}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold">${part.salePrice.toFixed(2)}</p>
                        <Badge variant={part.stock > (part.minStock || 0) ? "secondary" : "destructive"}>
                          Stock: {part.stock}
                        </Badge>
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
