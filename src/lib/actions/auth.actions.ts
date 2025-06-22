// src/lib/actions/auth.actions.ts
"use server";

import type { User, UserStatus, StoreSettings, Branch } from "@/types";
import { LoginSchema, ResetPasswordSchema, RegisterSchema } from "@/lib/schemas";
import type { z } from "zod";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { getBranches } from "./branch.actions";

// Mock database of users
let mockUsers: User[] = [
  {
    uid: "admin123",
    name: "Jesús (Super Admin)",
    email: "jesus@mobyland.com.ar",
    avatarUrl: "https://i.pravatar.cc/150?u=admin123",
    role: "admin", // Global role
    assignments: [], // Super admin has access to everything, no specific assignments needed
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: "tech123",
    name: "Tech User (Suc. Central)",
    email: "tech@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=tech123",
    role: "tecnico",
    assignments: [
        { branchId: "B001", role: "tecnico" }
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: "manager456",
    name: "Manager User (Multi-Sucursal)",
    email: "manager@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=manager456",
    role: "admin", // Highest role across assignments
    assignments: [
        { branchId: "B001", role: "admin" },
        { branchId: "B002", role: "tecnico" }
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock password store
let mockPasswords: Record<string, string> = {
  "jesus@mobyland.com.ar": "42831613aA@",
  "tech@example.com": "password123",
  "manager@example.com": "password123",
};


// --- NEWLY EXPORTED HELPER FUNCTIONS ---

export async function getAllMockUsers(): Promise<User[]> {
  return JSON.parse(JSON.stringify(mockUsers));
}

export async function updateAllMockUsers(newUsers: User[]): Promise<void> {
  mockUsers = newUsers;
}

export async function getMockPasswords(): Promise<Record<string, string>> {
  return JSON.parse(JSON.stringify(mockPasswords));
}

export async function setMockPassword(email: string, password: string): Promise<void> {
  mockPasswords[email] = password;
}

export async function deleteMockPassword(email: string): Promise<void> {
  delete mockPasswords[email];
}

export async function getUserById(uid: string): Promise<User | undefined> {
  const user = mockUsers.find(u => u.uid === uid);
  return user ? JSON.parse(JSON.stringify(user)) : undefined;
}


// --- EXISTING AUTH FUNCTIONS ---

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

  const branches = await getBranches();
  const defaultBranchId = branches.length > 0 ? branches[0].id : undefined;

  const newUser: User = {
    uid: `user-${Date.now()}`,
    name,
    email,
    avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
    role: "tecnico",
    status: "pending",
    assignments: defaultBranchId ? [{ branchId: defaultBranchId, role: 'tecnico'}] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  mockPasswords[email] = password;

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
    return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
  }

  console.log(`Password reset email sent to ${email} (mock)`);
  return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  return { success: true };
}
