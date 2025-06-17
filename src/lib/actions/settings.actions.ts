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
    const mergedSettings: StoreSettings = {
      ...DEFAULT_STORE_SETTINGS,
      ...user.storeSettings,
      abandonmentPolicyDays30: Number(user.storeSettings.abandonmentPolicyDays30 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays30),
      abandonmentPolicyDays60: Number(user.storeSettings.abandonmentPolicyDays60 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays60),
      // Ensure all new legal text fields are merged
      unlockDisclaimerText: user.storeSettings.unlockDisclaimerText ?? DEFAULT_STORE_SETTINGS.unlockDisclaimerText,
      abandonmentPolicyText: user.storeSettings.abandonmentPolicyText ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyText,
      dataLossPolicyText: user.storeSettings.dataLossPolicyText ?? DEFAULT_STORE_SETTINGS.dataLossPolicyText,
      untestedDevicePolicyText: user.storeSettings.untestedDevicePolicyText ?? DEFAULT_STORE_SETTINGS.untestedDevicePolicyText,
      budgetVariationText: user.storeSettings.budgetVariationText ?? DEFAULT_STORE_SETTINGS.budgetVariationText,
      highRiskDeviceText: user.storeSettings.highRiskDeviceText ?? DEFAULT_STORE_SETTINGS.highRiskDeviceText,
      partialDamageDisplayText: user.storeSettings.partialDamageDisplayText ?? DEFAULT_STORE_SETTINGS.partialDamageDisplayText,
      warrantyVoidConditionsText: user.storeSettings.warrantyVoidConditionsText ?? DEFAULT_STORE_SETTINGS.warrantyVoidConditionsText,
      privacyPolicyText: user.storeSettings.privacyPolicyText ?? DEFAULT_STORE_SETTINGS.privacyPolicyText,
      warrantyConditions: user.storeSettings.warrantyConditions ?? DEFAULT_STORE_SETTINGS.warrantyConditions,
      pickupConditions: user.storeSettings.pickupConditions ?? DEFAULT_STORE_SETTINGS.pickupConditions,
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
    abandonmentPolicyDays30: Number(validatedFields.data.abandonmentPolicyDays30 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays30),
    abandonmentPolicyDays60: Number(validatedFields.data.abandonmentPolicyDays60 ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyDays60),
    // Ensure all new legal text fields are part of the new settings
    unlockDisclaimerText: validatedFields.data.unlockDisclaimerText ?? DEFAULT_STORE_SETTINGS.unlockDisclaimerText,
    abandonmentPolicyText: validatedFields.data.abandonmentPolicyText ?? DEFAULT_STORE_SETTINGS.abandonmentPolicyText,
    dataLossPolicyText: validatedFields.data.dataLossPolicyText ?? DEFAULT_STORE_SETTINGS.dataLossPolicyText,
    untestedDevicePolicyText: validatedFields.data.untestedDevicePolicyText ?? DEFAULT_STORE_SETTINGS.untestedDevicePolicyText,
    budgetVariationText: validatedFields.data.budgetVariationText ?? DEFAULT_STORE_SETTINGS.budgetVariationText,
    highRiskDeviceText: validatedFields.data.highRiskDeviceText ?? DEFAULT_STORE_SETTINGS.highRiskDeviceText,
    partialDamageDisplayText: validatedFields.data.partialDamageDisplayText ?? DEFAULT_STORE_SETTINGS.partialDamageDisplayText,
    warrantyVoidConditionsText: validatedFields.data.warrantyVoidConditionsText ?? DEFAULT_STORE_SETTINGS.warrantyVoidConditionsText,
    privacyPolicyText: validatedFields.data.privacyPolicyText ?? DEFAULT_STORE_SETTINGS.privacyPolicyText,
    warrantyConditions: validatedFields.data.warrantyConditions ?? DEFAULT_STORE_SETTINGS.warrantyConditions,
    pickupConditions: validatedFields.data.pickupConditions ?? DEFAULT_STORE_SETTINGS.pickupConditions,
  };
  currentUsers[userIndex].storeSettings = newSettings;
  currentUsers[userIndex].updatedAt = new Date().toISOString();
  await updateAllMockUsers(currentUsers);
  
  return { 
    success: true, 
    message: "Configuración de la tienda guardada exitosamente.", 
    settings: { ...newSettings } 
  };
}
