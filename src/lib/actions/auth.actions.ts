// src/lib/actions/auth.actions.ts
"use server";

import type { User } from "@/types";
import { LoginSchema, ResetPasswordSchema } from "@/lib/schemas";
import type { z } from "zod";

// Mock database of users
const mockUsers: User[] = [
  {
    uid: "admin123",
    name: "Jesús Admin",
    email: "jesus@mobyland.com.ar",
    role: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: "tech123",
    name: "Carlos Técnico",
    email: "carlos@mobyland.com.ar",
    role: "tecnico",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock password store (in a real app, Firebase handles this securely)
const mockPasswords: Record<string, string> = {
  "jesus@mobyland.com.ar": "42831613aA@",
  "carlos@mobyland.com.ar": "password123",
};

export async function login(
  values: z.infer<typeof LoginSchema>
): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Campos inválidos." };
  }

  const { email, password } = validatedFields.data;

  const user = mockUsers.find((u) => u.email === email);

  if (!user) {
    return { success: false, message: "Usuario no encontrado." };
  }

  if (mockPasswords[email] !== password) {
    return { success: false, message: "Contraseña incorrecta." };
  }
  
  // In a real app, Firebase would set a session cookie or token.
  // Here, we return the user data to be stored in localStorage by the client.
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
  const userExists = mockUsers.some(u => u.email === email);

  if (!userExists) {
    // For security, don't reveal if email exists or not, standard practice
    // return { success: false, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
    // For mock, we can be more direct
    return { success: false, message: "Usuario no encontrado con este email." };
  }

  // Simulate sending a reset email
  console.log(`Password reset email sent to ${email} (mock)`);
  return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
}

// Logout is primarily a client-side state clearing operation in this mock setup.
// If server session needs invalidation, it would go here.
export async function logoutAction(): Promise<{ success: boolean }> {
  // Invalidate server session if any
  return { success: true };
}
