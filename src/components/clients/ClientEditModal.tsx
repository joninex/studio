
"use client";

import { ClientForm } from "./ClientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Client } from "@/types";

interface ClientEditModalProps {
    client: Client | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onClientUpdate: (updatedClient: Client) => void;
}

export function ClientEditModal({ client, isOpen, onOpenChange, onClientUpdate }: ClientEditModalProps) {
    if (!client) return null;

    const handleUpdate = (updatedClient: Client) => {
        onClientUpdate(updatedClient);
        onOpenChange(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Editando Cliente: {client.name} {client.lastName}</DialogTitle>
                    <DialogDescription>Modifique los detalles del cliente. Los cambios se guardarán y reflejarán en la orden.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[80vh] overflow-y-auto">
                    <ClientForm 
                        clientId={client.id} 
                        initialData={client}
                        onSuccess={handleUpdate}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
