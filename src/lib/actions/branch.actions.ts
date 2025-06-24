// src/lib/actions/branch.actions.ts
"use server";

import type { Branch, StoreSettings } from "@/types";
import { BranchSchema, StoreSettingsSchema } from "@/lib/schemas";
import type { z } from "zod";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

let mockBranches: Branch[] = [
    {
        id: "B001",
        name: "Sucursal Central",
        address: "Av. Corrientes 1234, CABA",
        phone: "(011) 4123-5678",
        email: "central@gori.app",
        status: 'active',
        settings: {
            ...DEFAULT_STORE_SETTINGS,
            id: "settings_b001",
            companyName: "G.O.R.I - Central",
            companyCuit: "30-11223344-5",
            companyAddress: "Av. Corrientes 1234, CABA",
            companyContactDetails: "Tel: (011) 4123-5678 | central@gori-serv.com",
            branchInfo: "Taller Central",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "B002",
        name: "Sucursal Norte",
        address: "Av. Maipú 500, Vicente López",
        phone: "(011) 4798-1234",
        email: "norte@gori.app",
        status: 'active',
        settings: {
            ...DEFAULT_STORE_SETTINGS,
            id: "settings_b002",
            companyName: "G.O.R.I - Suc. Norte",
            companyCuit: "30-55667788-9",
            companyAddress: "Av. Maipú 500, Vicente López",
            companyContactDetails: "Tel: (011) 4798-1234 | norte@gori-serv.com",
            branchInfo: "Sucursal Zona Norte",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "B003",
        name: "Depósito y Taller Avanzado",
        address: "Parque Industrial, Lote 15",
        phone: "N/A",
        email: "deposito@gori.app",
        status: 'inactive',
        settings: {
            ...DEFAULT_STORE_SETTINGS,
            id: "settings_b003",
            companyName: "G.O.R.I - Depósito",
            companyCuit: "30-99887766-5",
            companyAddress: "Parque Industrial, Lote 15",
            companyContactDetails: "interno@gori-serv.com",
            branchInfo: "Depósito y Taller Avanzado",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];
let branchCounter = mockBranches.length;

function generateBranchId(): string {
  branchCounter += 1;
  return `B${String(branchCounter).padStart(3, '0')}`;
}

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
