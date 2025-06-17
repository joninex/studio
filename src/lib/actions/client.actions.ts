// src/lib/actions/client.actions.ts
"use server";

import type { Client } from "@/types";
import { ClientSchema } from "@/lib/schemas";
import type { z } from "zod";

// Mock database for clients
let mockClients: Client[] = [
  {
    id: "CLI001",
    name: "Juan",
    lastName: "Perez",
    dni: "12345678",
    phone: "1122334455",
    email: "juan.perez@example.com",
    address: "Calle Falsa 123, Springfield",
    notes: "Cliente recurrente.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "CLI002",
    name: "Maria",
    lastName: "Lopez",
    dni: "87654321",
    phone: "5544332211",
    email: "maria.lopez@example.com",
    address: "Avenida Siempreviva 742",
    notes: "Prefiere contacto por WhatsApp.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "CLI003",
    name: "Carlos",
    lastName: "Gomez",
    dni: "11223344",
    phone: "0303456",
    email: "carlos.gomez@example.com",
    address: "",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
let clientCounter = mockClients.length;

function generateClientId(): string {
  clientCounter += 1;
  return `CLI${String(clientCounter).padStart(3, '0')}`;
}

export async function getClientById(clientId: string): Promise<Client | null> {
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API delay
  const client = mockClients.find(c => c.id === clientId);
  return client ? { ...client } : null;
}

export async function getMockClients(): Promise<Client[]> {
  // Helper function to be used by other server actions if needed (e.g., getOrders)
  await new Promise(resolve => setTimeout(resolve, 50));
  return JSON.parse(JSON.stringify(mockClients));
}

export async function createClient(
  values: z.infer<typeof ClientSchema>
): Promise<{ success: boolean; message: string; client?: Client }> {
  const validatedFields = ClientSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de cliente inválidos." };
  }
  const newId = generateClientId();
  const newClient: Client = {
    id: newId,
    ...validatedFields.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockClients.push(newClient);
  return { success: true, message: "Cliente creado exitosamente.", client: newClient };
}

export async function getClients(filters?: {
  name?: string;
  dni?: string;
  phone?: string;
}): Promise<Client[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let filteredClients = mockClients;
  if (filters) {
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      filteredClients = filteredClients.filter(
        (c) =>
          c.name.toLowerCase().includes(nameLower) ||
          c.lastName.toLowerCase().includes(nameLower)
      );
    }
    if (filters.dni) {
      filteredClients = filteredClients.filter((c) =>
        c.dni.includes(filters.dni!)
      );
    }
    if (filters.phone) {
      filteredClients = filteredClients.filter((c) =>
        c.phone.includes(filters.phone!)
      );
    }
  }
  return [...filteredClients].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );
}
