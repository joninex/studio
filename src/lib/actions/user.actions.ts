// src/lib/actions/user.actions.ts
"use server";

import type { User, UserStatus } from "@/types";
import { UserSchema } from "@/lib/schemas";
import type { z } from "zod";
import { 
  getAllMockUsers, 
  updateAllMockUsers,
  getMockPasswords,
  setMockPassword,
  deleteMockPassword
} from "./auth.actions"; // Import helpers

export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
  return getAllMockUsers();
}

export async function createUser(data: z.infer<typeof UserSchema>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de usuario inválidos." };
  }

  const { email, password, name, role } = validatedFields.data;
  const currentUsers = getAllMockUsers();

  if (currentUsers.find(u => u.email === email)) {
    return { success: false, message: "El email ya está registrado." };
  }
  if (!password) { 
    return { success: false, message: "La contraseña es requerida para nuevos usuarios." };
  }

  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newUser: User = { 
    uid: `newUser-${Date.now()}`, 
    email,
    name,
    role,
    status: "active", // Users created by admin are active by default
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  };
  const updatedUsers = [...currentUsers, newUser];
  updateAllMockUsers(updatedUsers);
  setMockPassword(email, password);
  
  return { success: true, message: "Usuario creado exitosamente.", user: JSON.parse(JSON.stringify(newUser)) };
}

export async function updateUser(uid: string, data: Partial<z.infer<typeof UserSchema>>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.partial().safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de actualización inválidos." };
  }

  const currentUsers = getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }
  
  await new Promise(resolve => setTimeout(resolve, 300));

  const { password, email, ...restData } = validatedFields.data;
  const existingUser = currentUsers[userIndex];

  if (email && email !== existingUser.email && currentUsers.some(u => u.email === email && u.uid !== uid)) {
    return { success: false, message: "El nuevo email ya está en uso por otro usuario." };
  }
  
  const updatedUser = { ...existingUser, ...restData, updatedAt: new Date().toISOString() };
  
  if (email && email !== existingUser.email) {
    const oldEmail = existingUser.email;
    const currentPasswords = getMockPasswords();
    if (currentPasswords[oldEmail]) {
        setMockPassword(email, currentPasswords[oldEmail]);
        deleteMockPassword(oldEmail);
    }
    updatedUser.email = email;
  }

  if (password) {
    setMockPassword(updatedUser.email, password);
  }
  
  currentUsers[userIndex] = updatedUser;
  updateAllMockUsers(currentUsers);
  
  return { success: true, message: "Usuario actualizado exitosamente.", user: JSON.parse(JSON.stringify(updatedUser)) };
}

export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let currentUsers = getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === uid);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  if (currentUsers[userIndex].email === "jesus@mobyland.com.ar") {
    return { success: false, message: "No se puede eliminar al administrador principal." };
  }

  const deletedUserEmail = currentUsers[userIndex].email;
  currentUsers.splice(userIndex, 1);
  updateAllMockUsers(currentUsers);
  deleteMockPassword(deletedUserEmail);

  return { success: true, message: "Usuario eliminado exitosamente." };
}


export async function updateUserStatus(uid: string, status: UserStatus): Promise<{ success: boolean; message: string; user?: User }> {
  let currentUsers = getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === uid);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  currentUsers[userIndex].status = status;
  currentUsers[userIndex].updatedAt = new Date().toISOString();
  updateAllMockUsers(currentUsers);

  const message = status === 'active' ? 'Usuario aprobado exitosamente.' :
                  status === 'denied' ? 'Usuario denegado exitosamente.' :
                  'Estado de usuario actualizado.';
  
  return { success: true, message, user: JSON.parse(JSON.stringify(currentUsers[userIndex])) };
}
