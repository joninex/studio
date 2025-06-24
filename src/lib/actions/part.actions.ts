// src/lib/actions/part.actions.ts
"use server";

import type { Part, PartCategory } from "@/types";
import { PartSchema, type PartFormData } from "@/lib/schemas";
import type { z } from "zod";

// Mock database for parts
let mockParts: Part[] = [
  {
    id: "PART001",
    name: "Pantalla iPhone 12 Original",
    sku: "IP12-SCR-OEM",
    description: "Pantalla de reemplazo original para iPhone 12.",
    category: "Pantalla",
    unit: "unidad",
    costPrice: 80,
    salePrice: 150,
    stock: 10,
    minStock: 2,
    supplierInfo: "Proveedor Apple Directo",
    notes: "Alta calidad, frágil.",
    imageUrl: "https://placehold.co/100x100.png?text=Pantalla",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "PART002",
    name: "Batería Samsung S21 Genérica",
    sku: "SAM-S21-BAT-GEN",
    description: "Batería compatible para Samsung Galaxy S21.",
    category: "Batería",
    unit: "unidad",
    costPrice: 20,
    salePrice: 45,
    stock: 25,
    minStock: 5,
    supplierInfo: "Importaciones Tech Global",
    notes: "Verificar compatibilidad de pines.",
    imageUrl: "https://placehold.co/100x100.png?text=Bateria",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "PART003",
    name: "Flex Pin de Carga Universal MicroUSB",
    sku: "FLX-MICUSB-UNIV",
    description: "Flex de pin de carga MicroUSB para varios modelos.",
    category: "Flex",
    unit: "unidad",
    costPrice: 5,
    salePrice: 15,
    stock: 50,
    minStock: 10,
    supplierInfo: "Componentes Electrónicos SRL",
    imageUrl: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
let partCounter = mockParts.length;

function generatePartId(): string {
  partCounter += 1;
  return `PART${String(partCounter).padStart(3, '0')}`;
}

export async function getPartById(partId: string): Promise<Part | null> {
  await new Promise(resolve => setTimeout(resolve, 150)); 
  const part = mockParts.find(p => p.id === partId);
  return part ? { ...part } : null;
}

export async function createPart(
  values: PartFormData
): Promise<{ success: boolean; message: string; part?: Part }> {
  const validatedFields = PartSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Part Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos del repuesto inválidos." };
  }
  const newId = generatePartId();
  const newPart: Part = {
    id: newId,
    ...validatedFields.data,
    category: validatedFields.data.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockParts.push(newPart);
  return { success: true, message: "Repuesto creado exitosamente.", part: newPart };
}

export async function updatePart(
  partId: string,
  values: PartFormData
): Promise<{ success: boolean; message: string; part?: Part }> {
  const validatedFields = PartSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Part Update Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos del repuesto inválidos para actualizar." };
  }

  const partIndex = mockParts.findIndex(p => p.id === partId);
  if (partIndex === -1) {
    return { success: false, message: "Repuesto no encontrado." };
  }

  const updatedPart: Part = {
    ...mockParts[partIndex],
    ...validatedFields.data,
    category: validatedFields.data.category,
    updatedAt: new Date().toISOString(),
  };
  mockParts[partIndex] = updatedPart;
  return { success: true, message: "Repuesto actualizado exitosamente.", part: updatedPart };
}

export async function deletePart(partId: string): Promise<{ success: boolean; message: string }> {
  const partIndex = mockParts.findIndex(p => p.id === partId);
  if (partIndex === -1) {
    return { success: false, message: "Repuesto no encontrado para eliminar." };
  }
  // Add logic here to check if part is in use before deleting, if necessary
  mockParts.splice(partIndex, 1);
  return { success: true, message: "Repuesto eliminado exitosamente." };
}

export async function getParts(filters?: {
  name?: string;
  sku?: string;
  category?: PartCategory;
}): Promise<Part[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); 
  let filteredParts = [...mockParts]; 
  if (filters) {
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      filteredParts = filteredParts.filter(p => p.name.toLowerCase().includes(nameLower));
    }
    if (filters.sku) {
      const skuLower = filters.sku.toLowerCase();
      filteredParts = filteredParts.filter(p => p.sku?.toLowerCase().includes(skuLower));
    }
    if (filters.category && filters.category !== "") {
      filteredParts = filteredParts.filter(p => p.category === filters.category);
    }
  }
  // Sort by name by default, or createdAt for a "newest first" feel
  return filteredParts.sort((a, b) => a.name.localeCompare(b.name));
  // return filteredParts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updatePartStock(partId: string, quantityChange: number): Promise<{ success: boolean; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 20)); // quick operation
  const partIndex = mockParts.findIndex(p => p.id === partId);
  if (partIndex === -1) {
    return { success: false, message: `Repuesto con ID ${partId} no encontrado.` };
  }

  const part = mockParts[partIndex];
  const newStock = part.stock + quantityChange; 

  if (newStock < 0) {
    return { success: false, message: `Stock insuficiente para ${part.name}. Stock actual: ${part.stock}, se necesitan ${-quantityChange}.` };
  }

  mockParts[partIndex].stock = newStock;
  mockParts[partIndex].updatedAt = new Date().toISOString();
  return { success: true };
}
