// src/lib/actions/client.actions.ts
"use server";

import type { Client } from "@/types";
import { ClientSchema, type ClientFormData } from "@/lib/schemas";

// Mock database for clients
let mockClients: Client[] = [
  {
    id: "1001",
    name: "Juan",
    lastName: "Perez",
    dni: "12345678",
    phone: "1122334455",
    email: "juan.perez@example.com",
    address: "Calle Falsa 123, Springfield",
    notes: "Cliente frecuente, prefiere reparaciones rápidas.",
    fiscalCondition: "Consumidor Final",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "1002",
    name: "Maria",
    lastName: "Lopez",
    dni: "87654321",
    phone: "5544332211",
    email: "maria.lopez@example.com",
    address: "Avenida Siempreviva 742",
    businessName: "Kwik-E-Mart",
    cuit: "30-87654321-5",
    fiscalCondition: "Responsable Inscripto",
    notes: "",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "1003",
    name: "Carlos",
    lastName: "Gomez",
    dni: "34567890",
    phone: "3344556677",
    email: "carlos.gomez@example.com",
    address: "Boulevard de los Sueños Rotos 100",
    fiscalCondition: "Monotributista",
    cuit: "20-34567890-1",
    notes: "Dejó un equipo que no enciende.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];
let clientCounter = 1003;

function generateClientId(): string {
  clientCounter += 1;
  return String(clientCounter);
}

export async function getClients(filters?: { search?: string }): Promise<Client[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let filteredClients = [...mockClients];

  if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredClients = filteredClients.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.lastName.toLowerCase().includes(searchLower) ||
        c.dni.includes(searchLower) ||
        (c.email && c.email.toLowerCase().includes(searchLower)) ||
        c.phone.includes(searchLower)
      );
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
