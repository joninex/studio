// src/lib/actions/settings.actions.ts
"use server";

import type { StoreSettings, User } from "@/types";
import { StoreSettingsSchema } from "@/lib/schemas";
import type { z } from "zod";
import { getUserById, updateAllMockUsers, getAllMockUsers } from "./auth.actions"; // Assuming these exist from auth refactor
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";


// This will now fetch settings for a specific user
export async function getStoreSettingsForUser(userId: string): Promise<StoreSettings> {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
  const user = await getUserById(userId);
  if (user && user.storeSettings) {
    // Ensure all default fields are present if some are missing
    return { ...DEFAULT_STORE_SETTINGS, ...user.storeSettings };
  }
  // Return default settings if user or their settings don't exist
  return { ...DEFAULT_STORE_SETTINGS };
}

// This will update settings for a specific user
export async function updateStoreSettingsForUser(
  userId: string,
  data: z.infer<typeof StoreSettingsSchema>
): Promise<{ success: boolean; message: string; settings?: StoreSettings }> {
  const validatedFields = StoreSettingsSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Store Settings Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de configuración de tienda inválidos." };
  }
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const currentUsers = getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === userId);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado para actualizar configuración." };
  }

  const newSettings = { 
    ...DEFAULT_STORE_SETTINGS, // Ensure all keys are present
    ...(currentUsers[userIndex].storeSettings || {}), 
    ...validatedFields.data,
    id: `store_config_${userId}` 
  };
  currentUsers[userIndex].storeSettings = newSettings;
  currentUsers[userIndex].updatedAt = new Date().toISOString();
  updateAllMockUsers(currentUsers); // Update the main mockUsers array
  
  console.log(`Updating store settings for user ${userId} (mock):`, newSettings);
  return { 
    success: true, 
    message: "Configuración de la tienda guardada exitosamente.", 
    settings: { ...newSettings } 
  };
}

// Deprecated global settings functions - can be removed or adapted if a global fallback is ever needed.
// For now, settings are strictly per-user.

// export async function getSettings(): Promise<Configurations> {
//   // This would fetch from a global store, but now we use per-user settings
//   await new Promise(resolve => setTimeout(resolve, 200));
//   return { ...DEFAULT_STORE_SETTINGS, id: "global_fallback_config" }; // Example fallback
// }

// export async function updateSettings(
//   data: z.infer<typeof SettingsSchema>
// ): Promise<{ success: boolean; message: string; settings?: Configurations }> {
//   // This would update a global store
//   return { success: false, message: "Global settings are no longer managed this way." };
// }
