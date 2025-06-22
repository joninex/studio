// src/lib/actions/client.actions.ts
"use server";

import type { Client } from "@/types";
import { ClientSchema, type ClientFormData } from "@/lib/schemas";

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
    notes: "Cliente frecuente, prefiere reparaciones rápidas.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
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
    notes: "",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "CLI003",
    name: "Carlos",
    lastName: "Gomez",
    dni: "34567890",
    phone: "3344556677",
    email: "carlos.gomez@example.com",
    address: "Boulevard de los Sueños Rotos 100",
    notes: "Dejó un equipo que no enciende.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];
let clientCounter = mockClients.length;

function generateClientId(): string {
  clientCounter += 1;
  return `CLI${String(clientCounter).padStart(3, '0')}`;
}

export async function getClients(filters?: { name?: string; dni?: string }): Promise<Client[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let filteredClients = [...mockClients];

  if (filters) {
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      filteredClients = filteredClients.filter(c =>
        `${c.name} ${c.lastName}`.toLowerCase().includes(nameLower)
      );
    }
    if (filters.dni) {
      filteredClients = filteredClients.filter(c => c.dni.includes(filters.dni!));
    }
  }

  return filteredClients.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
}

export async function getClientById(clientId: string): Promise<Client | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const client = mockClients.find(c => c.id === clientId);
  return client ? { ...client } : null;
}

export async function createClient(values: ClientFormData): Promise<{ success: boolean; message: string; client?: Client }> {
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

  mockClients.unshift(newClient);
  return { success: true, message: "Cliente creado exitosamente.", client: newClient };
}

export async function updateClient(clientId: string, values: ClientFormData): Promise<{ success: boolean; message: string; client?: Client }> {
  const validatedFields = ClientSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: "Datos para actualizar inválidos." };
  }

  const clientIndex = mockClients.findIndex(c => c.id === clientId);
  if (clientIndex === -1) {
    return { success: false, message: "Cliente no encontrado." };
  }
  
  const updatedClient: Client = {
    ...mockClients[clientIndex],
    ...validatedFields.data,
    updatedAt: new Date().toISOString(),
  };

  mockClients[clientIndex] = updatedClient;
  return { success: true, message: "Cliente actualizado exitosamente.", client: updatedClient };
}

export async function getMockClients(): Promise<Client[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return JSON.parse(JSON.stringify(mockClients));
}
