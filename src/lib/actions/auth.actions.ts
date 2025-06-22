// src/lib/actions/auth.actions.ts
"use server";

import type { User, UserStatus } from "@/types";
import { LoginSchema, ResetPasswordSchema, RegisterSchema } from "@/lib/schemas";
import type { z } from "zod";

// Mock database of users
const mockUsers: User[] = [
  {
    uid: "admin123",
    name: "Admin User",
    email: "admin@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=admin123", // Example avatar
    role: "admin",
    status: "active",
  },
  {
    uid: "tech123",
    name: "Tech User",
    email: "tech@example.com",
    avatarUrl: "https://i.pravatar.cc/150?u=tech123", // Example avatar
    role: "tecnico",
    status: "active",
  },
];

// Mock password store
const mockPasswords: Record<string, string> = {
  "admin@example.com": "password123",
  "tech@example.com": "password123",
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
  
  return { success: true, message: "Inicio de sesión exitoso.", user };
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
    uid: `user-${Date.now()}`,
    name,
    email,
    avatarUrl: `https://i.pravatar.cc/150?u=${email}`, // Default avatar
    role: "tecnico", // Default role for new registrations
    status: "pending", // New users start as pending
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
