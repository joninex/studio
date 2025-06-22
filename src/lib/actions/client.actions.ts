// src/lib/actions/client.actions.ts
"use server";

import type { Client } from "@/types";

// Mock database for clients
const mockClients: Client[] = [
  {
    id: "CLI001",
    name: "Juan",
    lastName: "Perez",
    dni: "12345678",
    phone: "1122334455",
    email: "juan.perez@example.com",
    address: "Calle Falsa 123, Springfield",
  },
  {
    id: "CLI002",
    name: "Maria",
    lastName: "Lopez",
    dni: "87654321",
    phone: "5544332211",
    email: "maria.lopez@example.com",
    address: "Avenida Siempreviva 742",
  }
];

export async function getClientById(clientId: string): Promise<Client | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const client = mockClients.find(c => c.id === clientId);
  return client ? { ...client } : null;
}

export async function getMockClients(): Promise<Client[]> {
  // Helper function to be used by other server actions
  await new Promise(resolve => setTimeout(resolve, 50));
  return JSON.parse(JSON.stringify(mockClients));
}
