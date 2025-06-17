// src/lib/actions/auth.actions.ts
"use server";

import type { User, UserStatus } from "@/types";
import { LoginSchema, ResetPasswordSchema, RegisterSchema } from "@/lib/schemas";
import type { z } from "zod";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

// Mock database of users - now includes status and storeSettings
let mockUsers: User[] = [
  {
    uid: "admin123",
    name: "Jesús Admin",
    email: "jesus@mobyland.com.ar",
    role: "admin",
    status: "active",
    storeSettings: { ...DEFAULT_STORE_SETTINGS, companyName: "JO-SERVICE Admin Store" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: "tech123",
    name: "Carlos Técnico",
    email: "carlos@mobyland.com.ar",
    role: "tecnico",
    status: "active",
    storeSettings: { ...DEFAULT_STORE_SETTINGS, companyName: "Carlos Tech Shop" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock password store
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

  if (user.status !== "active") {
    let statusMessage = "Su cuenta no está activa.";
    if (user.status === "pending") statusMessage = "Su cuenta está pendiente de aprobación.";
    if (user.status === "denied") statusMessage = "El acceso para su cuenta ha sido denegado.";
    return { success: false, message: statusMessage };
  }

  if (mockPasswords[email] !== password) {
    return { success: false, message: "Contraseña incorrecta." };
  }
  
  return { success: true, message: "Inicio de sesión exitoso.", user: JSON.parse(JSON.stringify(user)) };
}

export async function registerUser(
  values: z.infer<typeof RegisterSchema>
): Promise<{ success: boolean; message: string; user?: Partial<User> }> {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Datos de registro inválidos." };
  }

  const { email, password, name } = validatedFields.data;

  if (mockUsers.find((u) => u.email === email)) {
    return { success: false, message: "Este email ya está registrado." };
  }

  const newUser: User = {
    uid: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    email,
    role: "tecnico", // Default role for new registrations
    status: "pending", // New users start as pending
    storeSettings: { ...DEFAULT_STORE_SETTINGS, companyName: `${name}'s Store (Default)` },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  mockPasswords[email] = password; // Store password

  console.log(`New user pending approval: ${email}`);
  return { success: true, message: "Registro exitoso. Su cuenta está pendiente de aprobación por un administrador." };
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
    // To prevent user enumeration, return a generic success message
    return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
  }

  // In a real app, generate a token and send email
  console.log(`Password reset email sent to ${email} (mock)`);
  return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  // This would typically involve clearing session cookies or tokens on the server
  // For a mock, just return success
  return { success: true };
}

// Helper to get user by ID (used internally by other actions potentially)
export async function getUserById(uid: string): Promise<User | null> {
  const user = mockUsers.find(u => u.uid === uid);
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

// Helper to get all users (used by user.actions.ts)
export async function getAllMockUsers(): Promise<User[]> {
  return JSON.parse(JSON.stringify(mockUsers));
}
// Helper to update all users (used by user.actions.ts)
export async function updateAllMockUsers(updatedUsers: User[]): Promise<void> {
  mockUsers = JSON.parse(JSON.stringify(updatedUsers));
}

// Helper for password storage (used by user.actions.ts)
export async function getMockPasswords(): Promise<Record<string, string>> {
    return mockPasswords;
}
export async function setMockPassword(email: string, pass: string): Promise<void> {
    mockPasswords[email] = pass;
}
export async function deleteMockPassword(email: string): Promise<void> {
    delete mockPasswords[email];
}
