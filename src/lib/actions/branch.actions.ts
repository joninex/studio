// src/lib/actions/branch.actions.ts
"use server";

import type { Branch, StoreSettings } from "@/types";
import { StoreSettingsSchema } from "@/lib/schemas";
import type { z } from "zod";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

let mockBranches: Branch[] = [
    {
        id: "B001",
        name: "Taller Central",
        address: "Av. Corrientes 1234, CABA",
        status: 'active',
        settings: {
            ...DEFAULT_STORE_SETTINGS,
            id: "settings_b001",
            companyName: "NexusServ 360 - Central",
            companyCuit: "30-11223344-5",
            companyAddress: "Av. Corrientes 1234, CABA",
            companyContactDetails: "Tel: (011) 4123-5678 | central@nexus-serv.com",
            branchInfo: "Taller Central",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "B002",
        name: "Sucursal Norte",
        address: "Av. Maipú 500, Vicente López",
        status: 'active',
        settings: {
            ...DEFAULT_STORE_SETTINGS,
            id: "settings_b002",
            companyName: "NexusServ 360 - Suc. Norte",
            companyCuit: "30-55667788-9",
            companyAddress: "Av. Maipú 500, Vicente López",
            companyContactDetails: "Tel: (011) 4798-1234 | norte@nexus-serv.com",
            branchInfo: "Sucursal Zona Norte",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

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
