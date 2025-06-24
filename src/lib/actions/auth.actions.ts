// src/lib/actions/auth.actions.ts
"use server";

import type { User, UserStatus, StoreSettings, Branch, UserRole } from "@/types";
import { LoginSchema, ResetPasswordSchema, RegisterSchema } from "@/lib/schemas";
import type { z } from "zod";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { getBranches } from "./branch.actions";

// Mock database of users, structured for testing roles and sectors.
let mockUsers: User[] = [
  // 1. Superadmin
  {
    uid: "superadmin001",
    name: "Administrador Global",
    email: "superadmin@gori.app",
    avatarUrl: "https://i.pravatar.cc/150?u=superadmin001",
    role: "admin",
    assignments: [], // Global access, no specific assignments needed
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 2. Administrador de sucursal (Central)
  {
    uid: "admin_central001",
    name: "Ana López",
    email: "admin_central@gori.app",
    avatarUrl: "https://i.pravatar.cc/150?u=admin_central001",
    role: "admin",
    assignments: [
        { branchId: "B001", role: "admin", sector: "Administración y Supervisión" }
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 3. Administrador de sucursal (Norte)
  {
    uid: "admin_norte001",
    name: "Carlos Diaz",
    email: "admin_norte@gori.app",
    avatarUrl: "https://i.pravatar.cc/150?u=admin_norte001",
    role: "admin",
    assignments: [
        { branchId: "B002", role: "admin", sector: "Administración y Supervisión" }
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 4. Técnico Reparador (Hardware)
  {
    uid: "tech_hw001",
    name: "Juan Pérez",
    email: "tech_hw@gori.app",
    avatarUrl: "https://i.pravatar.cc/150?u=tech_hw001",
    role: "tecnico",
    assignments: [
        { branchId: "B001", role: "tecnico", sector: "Laboratorio Hardware" }
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 5. Técnico Reparador (Software)
  {
    uid: "tech_sw001",
    name: "Maria Garcia",
    email: "tech_sw@gori.app",
    avatarUrl: "https://i.pravatar.cc/150?u=tech_sw001",
    role: "tecnico",
    assignments: [
        { branchId: "B001", role: "tecnico", sector: "Laboratorio Software" }
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 6. Técnico Administrativo (mapped to 'recepcionista' role)
  {
    uid: "recep_admin001",
    name: "Luis Torres",
    email: "tech_admin@gori.app",
    avatarUrl: "https://i.pravatar.cc/150?u=recep_admin001",
    role: "recepcionista",
    assignments: [
        { branchId: "B001", role: "recepcionista", sector: "Administración" }
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 7. Mostrador / Atención Presencial
  {
    uid: "recep_front001",
    name: "Sofia Gomez",
    email: "mostrador@gori.app",
    avatarUrl: "https://i.pravatar.cc/150?u=recep_front001",
    role: "recepcionista",
    assignments: [
        { branchId: "B001", role: "recepcionista", sector: "Recepción" }
    ],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];


// Mock password store
let mockPasswords: Record<string, string> = {
  "superadmin@gori.app": "Nexus360Pass!",
  "admin_central@gori.app": "Nexus360Pass!",
  "admin_norte@gori.app": "Nexus360Pass!",
  "tech_hw@gori.app": "Nexus360Pass!",
  "tech_sw@gori.app": "Nexus360Pass!",
  "tech_admin@gori.app": "Nexus360Pass!",
  "mostrador@gori.app": "Nexus360Pass!",
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
    role: "recepcionista",
    status: "pending",
    assignments: defaultBranchId ? [{ branchId: defaultBranchId, role: 'recepcionista'}] : [],
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
