// src/lib/actions/auth.actions.ts
"use server";

import type { User } from "@/types";
import { LoginSchema, ResetPasswordSchema } from "@/lib/schemas";
import type { z } from "zod";
import { 
    getUserByEmail, 
    verifyUserPassword
} from "./user.actions";

export async function login(
  values: z.infer<typeof LoginSchema>
): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Campos inválidos." };
  }

  const { email, password } = validatedFields.data;
  const user = await getUserByEmail(email);

  if (!user) {
    return { success: false, message: "Usuario no encontrado." };
  }
  
  if (user.status !== "active") {
    let statusMessage = "Su cuenta no está activa.";
    if (user.status === "pending") statusMessage = "Su cuenta está pendiente de aprobación.";
    if (user.status === "denied") statusMessage = "El acceso para su cuenta ha sido denegado.";
    return { success: false, message: statusMessage };
  }

  const isPasswordValid = await verifyUserPassword(email, password);
  if (!isPasswordValid) {
    return { success: false, message: "Contraseña incorrecta." };
  }
  
  return { success: true, message: "Inicio de sesión exitoso.", user };
}

export async function resetPassword(
  values: z.infer<typeof ResetPasswordSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = ResetPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Campos inválidos." };
  }

  const { email } = validatedFields.data;
  const userExists = await getUserByEmail(email);

  if (!userExists) {
    // No revelamos si el usuario existe o no por seguridad.
    return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
  }

  // Lógica de GORI para enviar el correo de restablecimiento.
  console.log(`Password reset email sent to ${email} (mock)`);
  return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  return { success: true };
}
