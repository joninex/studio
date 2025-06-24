// src/lib/actions/branch.actions.ts
"use server";

import type { Branch, StoreSettings } from "@/types";
import { BranchSchema, StoreSettingsSchema } from "@/lib/schemas";
import type { z } from "zod";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

let mockBranches: Branch[] = [];
let branchCounter = mockBranches.length;

function generateBranchId(): string {
  branchCounter += 1;
  return `B${String(branchCounter).padStart(3, '0')}`;
}

// --- Funciones para Backup y Restauración ---
export async function getRawBranchData() {
  return {
    branches: mockBranches,
    counter: branchCounter,
  };
}

export async function restoreBranchData(data: { branches: Branch[]; counter: number }) {
  mockBranches = data.branches || [];
  branchCounter = data.counter || (data.branches?.length ?? 0);
}
// --- Fin Funciones para Backup y Restauración ---


export async function getBranches(): Promise<Branch[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return JSON.parse(JSON.stringify(mockBranches));
}

export async function getBranchById(branchId: string): Promise<Branch | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const branch = mockBranches.find(b => b.id === branchId);
    return branch ? JSON.parse(JSON.stringify(branch)) : null;
}

export async function getSettingsForBranch(branchId: string): Promise<StoreSettings> {
    const branch = await getBranchById(branchId);
    if (branch) {
        return branch.settings;
    }
    // Fallback to default settings if branch not found
    return { ...DEFAULT_STORE_SETTINGS };
}

export async function updateSettingsForBranch(
  branchId: string,
  data: z.infer<typeof StoreSettingsSchema>
): Promise<{ success: boolean; message: string; settings?: StoreSettings }> {
  const validatedFields = StoreSettingsSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Store Settings Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de configuración de tienda inválidos." };
  }
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const branchIndex = mockBranches.findIndex(b => b.id === branchId);

  if (branchIndex === -1) {
    return { success: false, message: "Sucursal no encontrada para actualizar configuración." };
  }

  const updatedSettings: StoreSettings = { 
    ...mockBranches[branchIndex].settings,
    ...validatedFields.data,
  };

  mockBranches[branchIndex].settings = updatedSettings;
  mockBranches[branchIndex].updatedAt = new Date().toISOString();
  
  return { 
    success: true, 
    message: "Configuración de la sucursal guardada exitosamente.", 
    settings: { ...updatedSettings } 
  };
}


export async function createBranch(data: z.infer<typeof BranchSchema>): Promise<{ success: boolean; message: string; branch?: Branch }> {
  const validatedFields = BranchSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de sucursal inválidos." };
  }
  
  await new Promise(resolve => setTimeout(resolve, 200));

  const newId = generateBranchId();
  const newBranch: Branch = {
    id: newId,
    ...validatedFields.data,
    settings: {
        ...DEFAULT_STORE_SETTINGS,
        id: `settings_${newId.toLowerCase()}`,
        companyName: `G.O.R.I - ${validatedFields.data.name}`,
        companyAddress: validatedFields.data.address,
        branchInfo: validatedFields.data.name,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockBranches.push(newBranch);
  return { success: true, message: "Sucursal creada exitosamente.", branch: newBranch };
}

export async function updateBranch(branchId: string, data: z.infer<typeof BranchSchema>): Promise<{ success: boolean; message: string; branch?: Branch }> {
  const validatedFields = BranchSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de actualización inválidos." };
  }
  
  await new Promise(resolve => setTimeout(resolve, 200));

  const branchIndex = mockBranches.findIndex(b => b.id === branchId);
  if (branchIndex === -1) {
    return { success: false, message: "Sucursal no encontrada." };
  }

  const updatedBranch: Branch = {
    ...mockBranches[branchIndex],
    ...validatedFields.data,
    updatedAt: new Date().toISOString(),
  };
  
  updatedBranch.settings.companyName = `G.O.R.I - ${validatedFields.data.name}`;
  updatedBranch.settings.branchInfo = validatedFields.data.name;
  updatedBranch.settings.companyAddress = validatedFields.data.address;

  mockBranches[branchIndex] = updatedBranch;
  return { success: true, message: "Sucursal actualizada exitosamente.", branch: updatedBranch };
}

export async function deleteBranch(branchId: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));
  // In a real app, check if branch has orders, users, etc. before deleting
  const branchIndex = mockBranches.findIndex(b => b.id === branchId);
  if (branchIndex === -1) {
    return { success: false, message: "Sucursal no encontrada." };
  }

  // Prevent deleting the last branch
  if(mockBranches.length <= 1) {
    return { success: false, message: "No se puede eliminar la única sucursal existente." };
  }

  mockBranches.splice(branchIndex, 1);
  return { success: true, message: "Sucursal eliminada exitosamente." };
}
