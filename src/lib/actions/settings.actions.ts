// src/lib/actions/settings.actions.ts
"use server";

import type { Configurations } from "@/types";
import { SettingsSchema } from "@/lib/schemas";
import type { z } from "zod";

// Mock global settings storage
let globalSettings: Configurations = {
  id: "general_config",
  companyName: "JO-SERVICE (Default)",
  companyLogoUrl: "https://placehold.co/150x50.png?text=JO-SERVICE",
  companyCuit: "30-12345678-9",
  companyAddress: "Calle Falsa 123, Springfield, Argentina",
  companyContactDetails: "JO-SERVICE\nTel: 123-456789\nEmail: contacto@joservice.com.ar",
  branchInfo: "JO-SERVICE Taller Central (Config)",
  warrantyConditions: "La garantía cubre únicamente la reparación efectuada por un plazo de 90 días y no cubre fallas preexistentes o nuevas fallas no relacionadas con la reparación original.",
  pickupConditions: "El equipo debe ser retirado dentro de los 30 días posteriores a la notificación de \"Listo para Retirar\". Pasado dicho plazo, se aplicarán cargos por almacenamiento.",
  abandonmentPolicyDays30: 30,
  abandonmentPolicyDays60: 60,
};

export async function getSettings(): Promise<Configurations> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return { ...globalSettings }; // Return a copy to prevent direct modification
}

export async function updateSettings(
  data: z.infer<typeof SettingsSchema>
): Promise<{ success: boolean; message: string; settings?: Configurations }> {
  const validatedFields = SettingsSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error("Settings Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de configuración inválidos." };
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  globalSettings = { 
    ...globalSettings, 
    ...validatedFields.data, 
    id: "general_config" 
  };
  
  console.log("Updating settings (mock):", globalSettings);
  return { 
    success: true, 
    message: "Configuración guardada exitosamente.", 
    settings: { ...globalSettings } 
  };
}
