// src/lib/actions/client.actions.ts
"use server";

import type { Client } from "@/types";
import { ClientSchema, type ClientFormData } from "@/lib/schemas";

// Mock database for clients
let mockClients: Client[] = [];
let clientCounter = 1000;

function generateClientId(): string {
  clientCounter += 1;
  return String(clientCounter);
}

// --- Funciones para Backup y Restauración ---
export async function getRawClientData() {
  return {
    clients: mockClients,
    counter: clientCounter,
  };
}

export async function restoreClientData(data: { clients: Client[]; counter: number }) {
  mockClients = data.clients || [];
  clientCounter = data.counter || (data.clients?.length ? 1000 + data.clients.length : 1000);
}
// --- Fin Funciones para Backup y Restauración ---


export async function getClients(branchId: string, filters?: { search?: string }): Promise<Client[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // First, filter by the mandatory branchId
  let filteredClients = mockClients.filter(c => c.branchId === branchId);

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

export async function createClient(values: ClientFormData, branchId: string): Promise<{ success: boolean; message: string; client?: Client }> {
  const validatedFields = ClientSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de cliente inválidos." };
  }

  const newId = generateClientId();
  const newClient: Client = {
    id: newId,
    branchId: branchId,
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
