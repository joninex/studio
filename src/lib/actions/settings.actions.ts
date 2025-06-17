// src/lib/actions/settings.actions.ts
"use server";

import type { StoreSettings, User } from "@/types";
import { StoreSettingsSchema } from "@/lib/schemas";
import type { z } from "zod";
import { getUserById, updateAllMockUsers, getAllMockUsers } from "./auth.actions";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";


export async function getStoreSettingsForUser(userId: string): Promise<StoreSettings> {
  await new Promise(resolve => setTimeout(resolve, 200)); 
  const user = await getUserById(userId);
  if (user && user.storeSettings) {
    // Ensure all default fields are present, overlaying with user's saved settings
    const mergedSettings: StoreSettings = {
      ...DEFAULT_STORE_SETTINGS,
      ...user.storeSettings,
      // Ensure numbers are numbers
      abandonmentPolicyDays30: Number(user.storeSettings.abandonmentPolicyDays30 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays30),
      abandonmentPolicyDays60: Number(user.storeSettings.abandonmentPolicyDays60 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays60),
    };
    return mergedSettings;
  }
  return { ...DEFAULT_STORE_SETTINGS };
}

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
  
  const currentUsers = await getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === userId);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado para actualizar configuración." };
  }

  const newSettings: StoreSettings = { 
    ...DEFAULT_STORE_SETTINGS, 
    ...(currentUsers[userIndex].storeSettings || {}), 
    ...validatedFields.data,
    id: `store_config_${userId}`,
    // Ensure numbers are stored as numbers
    abandonmentPolicyDays30: Number(validatedFields.data.abandonmentPolicyDays30 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays30),
    abandonmentPolicyDays60: Number(validatedFields.data.abandonmentPolicyDays60 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays60),
  };
  currentUsers[userIndex].storeSettings = newSettings;
  currentUsers[userIndex].updatedAt = new Date().toISOString();
  await updateAllMockUsers(currentUsers);
  
  console.log(`Updating store settings for user ${userId} (mock):`, newSettings);
  return { 
    success: true, 
    message: "Configuración de la tienda guardada exitosamente.", 
    settings: { ...newSettings } 
  };
}
