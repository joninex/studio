// src/components/orders/DeclaredFaultInput.tsx
"use client";

import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { OrderFormData } from "@/lib/schemas";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { getCommonFaults } from "@/lib/actions/commonFaults.actions";
import type { CommonFault } from "@/types";
import { Badge } from "../ui/badge";
import { LoadingSpinner } from "../shared/LoadingSpinner";

export function DeclaredFaultInput() {
    const { setValue, watch } = useFormContext<OrderFormData>();
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<CommonFault[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const declaredFaultValue = watch("declaredFault", "");

    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const results = await getCommonFaults(searchQuery);
            setSuggestions(results);
        } catch (error) {
            console.error("Failed to fetch fault suggestions:", error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleValueChange = (value: string) => {
        setValue("declaredFault", value, { shouldValidate: true });
        
        // Regex to find a trigger (@ or /) followed by characters at the end of the string
        const triggerRegex = /([@\/])([\w-]*)$/;
        const match = value.match(triggerRegex);

        if (match) {
            const currentQuery = match[2];
            fetchSuggestions(currentQuery);
            if (!isOpen) setIsOpen(true);
        } else {
            if (isOpen) setIsOpen(false);
        }
    };

    const handleSelect = (fault: CommonFault) => {
        const currentValue = declaredFaultValue || "";
        const triggerRegex = /([@\/])([\w-]*)$/;
        const newValue = currentValue.replace(triggerRegex, fault.fullText + " ");
        setValue("declaredFault", newValue, { shouldValidate: true });
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverAnchor>
                <Textarea
                    placeholder="Escriba la falla o use @ / para ver fallas comunes"
                    value={declaredFaultValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className="min-h-[100px]"
                />
            </PopoverAnchor>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandList>
                        {isLoading ? (
                            <div className="p-4 flex justify-center items-center">
                                <LoadingSpinner size={20} />
                                <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>No se encontraron fallas.</CommandEmpty>
                                <CommandGroup heading="Sugerencias">
                                    {suggestions.map((fault) => (
                                        <CommandItem
                                            key={fault.id}
                                            onSelect={() => handleSelect(fault)}
                                            value={fault.activator}
                                        >
                                            <div className="flex flex-col w-full py-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-primary">{fault.activator}</span>
                                                    <Badge variant="outline">{fault.category}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{fault.fullText}</p>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
