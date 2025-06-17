// src/lib/actions/supplier.actions.ts
"use server";

import type { Supplier } from "@/types";
import { SupplierSchema, type SupplierFormData } from "@/lib/schemas";
import type { z } from "zod";

// Mock database for suppliers
let mockSuppliers: Supplier[] = [
  {
    id: "SUP001",
    name: "ElectroComponentes Web",
    contactName: "Juan Ventas",
    phone: "5491112345678", // Example Argentina WhatsApp number
    email: "ventas@electrocomponentes.com",
    address: "Online Store",
    cuit: "30-12345678-9",
    notes: "Principal proveedor de pantallas y baterías.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "SUP002",
    name: "Importadora Tech Global",
    contactName: "Ana Logística",
    phone: "541187654321", // Another example
    email: "info@techglobal.com.ar",
    address: "Calle Falsa 456, Ciudad",
    cuit: "33-87654321-0",
    notes: "Buenos precios en flex y componentes menores.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "SUP003",
    name: "FixParts Argentina",
    contactName: "",
    phone: "1122334455", // Local number without country code
    email: "pedidos@fixparts.com.ar",
    address: "Av. Siempreviva 742",
    notes: "Herramientas y algunos insumos.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
let supplierCounter = mockSuppliers.length;

function generateSupplierId(): string {
  supplierCounter += 1;
  return `SUP${String(supplierCounter).padStart(3, '0')}`;
}

export async function getSupplierById(supplierId: string): Promise<Supplier | null> {
  await new Promise(resolve => setTimeout(resolve, 150)); 
  const supplier = mockSuppliers.find(s => s.id === supplierId);
  return supplier ? { ...supplier } : null;
}

export async function createSupplier(
  values: SupplierFormData
): Promise<{ success: boolean; message: string; supplier?: Supplier }> {
  const validatedFields = SupplierSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Supplier Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos del proveedor inválidos." };
  }
  const newId = generateSupplierId();
  const newSupplier: Supplier = {
    id: newId,
    ...validatedFields.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockSuppliers.push(newSupplier);
  return { success: true, message: "Proveedor creado exitosamente.", supplier: newSupplier };
}

export async function updateSupplier(
  supplierId: string,
  values: SupplierFormData
): Promise<{ success: boolean; message: string; supplier?: Supplier }> {
  const validatedFields = SupplierSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Supplier Update Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos del proveedor inválidos para actualizar." };
  }

  const supplierIndex = mockSuppliers.findIndex(s => s.id === supplierId);
  if (supplierIndex === -1) {
    return { success: false, message: "Proveedor no encontrado." };
  }

  const updatedSupplier: Supplier = {
    ...mockSuppliers[supplierIndex],
    ...validatedFields.data,
    updatedAt: new Date().toISOString(),
  };
  mockSuppliers[supplierIndex] = updatedSupplier;
  return { success: true, message: "Proveedor actualizado exitosamente.", supplier: updatedSupplier };
}

export async function deleteSupplier(supplierId: string): Promise<{ success: boolean; message: string }> {
  const supplierIndex = mockSuppliers.findIndex(s => s.id === supplierId);
  if (supplierIndex === -1) {
    return { success: false, message: "Proveedor no encontrado para eliminar." };
  }
  // Future: Add logic to check if supplier is linked to parts before deleting.
  mockSuppliers.splice(supplierIndex, 1);
  return { success: true, message: "Proveedor eliminado exitosamente." };
}

export async function getSuppliers(filters?: {
  name?: string;
  contactName?: string;
}): Promise<Supplier[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); 
  let filteredSuppliers = [...mockSuppliers]; 
  if (filters) {
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      filteredSuppliers = filteredSuppliers.filter(s => s.name.toLowerCase().includes(nameLower));
    }
    if (filters.contactName) {
      const contactNameLower = filters.contactName.toLowerCase();
      filteredSuppliers = filteredSuppliers.filter(s => s.contactName?.toLowerCase().includes(contactNameLower));
    }
  }
  return filteredSuppliers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
