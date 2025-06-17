// src/lib/actions/user.actions.ts
"use server";

import type { User } from "@/types";
import { UserSchema } from "@/lib/schemas";
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

export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return a copy to prevent direct modification of the mock array
  return JSON.parse(JSON.stringify(mockUsers));
}

export async function createUser(data: z.infer<typeof UserSchema>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de usuario inválidos." };
  }

  const { email, password, ...restData } = validatedFields.data;

  if (mockUsers.find(u => u.email === email)) {
    return { success: false, message: "El email ya está registrado." };
  }
  if (!password) { // Password is required for new users by schema, but double check.
    return { success: false, message: "La contraseña es requerida para nuevos usuarios." };
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newUser: User = { 
    uid: `newUser${Date.now()}`, 
    email,
    ...restData, 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  };
  mockUsers.push(newUser);
  mockPasswords[email] = password; // Store password for mock login
  
  return { success: true, message: "Usuario creado exitosamente.", user: JSON.parse(JSON.stringify(newUser)) };
}

export async function updateUser(uid: string, data: Partial<z.infer<typeof UserSchema>>): Promise<{ success: boolean; message: string; user?: User }> {
  // Validate only the provided fields. Password should be optional for update.
  const validatedFields = UserSchema.partial().safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de actualización inválidos." };
  }

  const userIndex = mockUsers.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));

  const { password, email, ...restData } = validatedFields.data;

  // Prevent email change if it's already taken by another user
  if (email && email !== mockUsers[userIndex].email && mockUsers.some(u => u.email === email && u.uid !== uid)) {
    return { success: false, message: "El nuevo email ya está en uso por otro usuario." };
  }
  
  // Update user data
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...restData, updatedAt: new Date().toISOString() };
  
  if (email && email !== mockUsers[userIndex].email) {
     // If email changes, update it in mockPasswords and user object.
     // This is a simplification; in a real system, email change might have more implications.
    const oldEmail = mockUsers[userIndex].email;
    if (mockPasswords[oldEmail]) {
        mockPasswords[email] = mockPasswords[oldEmail];
        delete mockPasswords[oldEmail];
    }
    mockUsers[userIndex].email = email;
  }

  if (password) { // Only update password if a new one is provided
    mockPasswords[mockUsers[userIndex].email] = password;
  }
  
  return { success: true, message: "Usuario actualizado exitosamente.", user: JSON.parse(JSON.stringify(mockUsers[userIndex])) };
}

export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const userIndex = mockUsers.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  // Prevent deleting the main admin for demo purposes
  if (mockUsers[userIndex].email === "jesus@mobyland.com.ar") {
    return { success: false, message: "No se puede eliminar al administrador principal." };
  }

  const deletedUserEmail = mockUsers[userIndex].email;
  mockUsers.splice(userIndex, 1);
  delete mockPasswords[deletedUserEmail]; // Remove password from mock store

  return { success: true, message: "Usuario eliminado exitosamente." };
}
