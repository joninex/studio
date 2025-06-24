// src/lib/actions/auth.actions.ts
"use server";

import type { User, UserStatus, StoreSettings, Branch, UserRole } from "@/types";
import { LoginSchema, ResetPasswordSchema, RegisterSchema } from "@/lib/schemas";
import type { z } from "zod";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { getBranches } from "./branch.actions";

// Mock database of users, structured for testing roles and sectors.
let mockUsers: User[] = [
    {
        uid: "superadmin_global",
        name: "Sergio Valente",
        email: "superadmin@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=superadmin_global",
        role: "admin",
        assignments: [], // Global scope
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "ana.lopez.admincen",
        name: "Ana López",
        email: "ana.lopez.admincen@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=ana.lopez.admincen",
        role: "admin",
        assignments: [{ branchId: "B001", role: "admin", sector: "Supervisión General, Administración" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "juan.perez.techhwcen",
        name: "Juan Pérez",
        email: "juan.perez.techhwcen@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=juan.perez.techhwcen",
        role: "tecnico",
        assignments: [{ branchId: "B001", role: "tecnico", sector: "Laboratorio Hardware" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "laura.gil.techswcen",
        name: "Laura Gil",
        email: "laura.gil.techswcen@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=laura.gil.techswcen",
        role: "tecnico",
        assignments: [{ branchId: "B001", role: "tecnico", sector: "Laboratorio Software" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "carlos.ruiz.tecadmincen",
        name: "Carlos Ruiz",
        email: "carlos.ruiz.tecadmincen@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=carlos.ruiz.tecadmincen",
        role: "recepcionista", // Using 'recepcionista' as proxy for 'Técnico Administrativo'
        assignments: [{ branchId: "B001", role: "recepcionista", sector: "Administración y Presupuestos, Compras" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "sofia.diaz.mostcen",
        name: "Sofía Díaz",
        email: "sofia.diaz.mostcen@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=sofia.diaz.mostcen",
        role: "recepcionista",
        assignments: [{ branchId: "B001", role: "recepcionista", sector: "Recepción / Mostrador" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "martin.gomez.adminnor",
        name: "Martín Gómez",
        email: "martin.gomez.adminnor@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=martin.gomez.adminnor",
        role: "admin",
        assignments: [{ branchId: "B002", role: "admin", sector: "Supervisión General, Administración" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "lucia.vega.technor",
        name: "Lucía Vega",
        email: "lucia.vega.technor@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=lucia.vega.technor",
        role: "tecnico",
        assignments: [{ branchId: "B002", role: "tecnico", sector: "Laboratorio Hardware, Laboratorio Software" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "david.ramos.tecadminnor",
        name: "David Ramos",
        email: "david.ramos.tecadminnor@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=david.ramos.tecadminnor",
        role: "recepcionista",
        assignments: [{ branchId: "B002", role: "recepcionista", sector: "Administración y Presupuestos, Compras" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        uid: "elena.cano.mostnor",
        name: "Elena Cano",
        email: "elena.cano.mostnor@gori.app",
        avatarUrl: "https://i.pravatar.cc/150?u=elena.cano.mostnor",
        role: "recepcionista",
        assignments: [{ branchId: "B002", role: "recepcionista", sector: "Recepción / Mostrador" }],
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Mock password store
let mockPasswords: Record<string, string> = {
  "superadmin@gori.app": "NexusPass2024!",
  "ana.lopez.admincen@gori.app": "NexusPass2024!",
  "juan.perez.techhwcen@gori.app": "NexusPass2024!",
  "laura.gil.techswcen@gori.app": "NexusPass2024!",
  "carlos.ruiz.tecadmincen@gori.app": "NexusPass2024!",
  "sofia.diaz.mostcen@gori.app": "NexusPass2024!",
  "martin.gomez.adminnor@gori.app": "NexusPass2024!",
  "lucia.vega.technor@gori.app": "NexusPass2024!",
  "david.ramos.tecadminnor@gori.app": "NexusPass2024!",
  "elena.cano.mostnor@gori.app": "NexusPass2024!",
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
    assignments: defaultBranchId ? [{ branchId: defaultBranchId, role: 'recepcionista', sector: "Recepción / Mostrador" }] : [],
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
