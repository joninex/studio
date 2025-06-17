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
  deleteMockPassword,
  getUserById // Added getUserById
} from "./auth.actions"; // Import helpers

export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
  return await getAllMockUsers();
}

export async function createUser(data: z.infer<typeof UserSchema>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de usuario inválidos." };
  }

  const { email, password, name, role } = validatedFields.data;
  const currentUsers = await getAllMockUsers();

  if (currentUsers.find(u => u.email === email)) {
    return { success: false, message: "El email ya está registrado." };
  }
  if (!password) { 
    return { success: false, message: "La contraseña es requerida para nuevos usuarios." };
  }

  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newUser: User = { 
    uid: `newUser-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, 
    email,
    name,
    role,
    status: "active", // Users created by admin are active by default
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
    // storeSettings will be default or initialized upon first save by user
  };
  const updatedUsers = [...currentUsers, newUser];
  await updateAllMockUsers(updatedUsers);
  await setMockPassword(email, password);
  
  return { success: true, message: "Usuario creado exitosamente.", user: JSON.parse(JSON.stringify(newUser)) };
}

export async function updateUser(uid: string, data: Partial<z.infer<typeof UserSchema>>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.partial().safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de actualización inválidos." };
  }

  const currentUsers = await getAllMockUsers();
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
    const currentPasswords = await getMockPasswords();
    if (currentPasswords[oldEmail]) {
        await setMockPassword(email, currentPasswords[oldEmail]); // Use await
        await deleteMockPassword(oldEmail); // Use await
    }
    updatedUser.email = email;
  }

  if (password && password.trim() !== "") { // Ensure password is not empty if provided
    await setMockPassword(updatedUser.email, password); // Use await
  }
  
  currentUsers[userIndex] = updatedUser;
  await updateAllMockUsers(currentUsers); // Use await
  
  return { success: true, message: "Usuario actualizado exitosamente.", user: JSON.parse(JSON.stringify(updatedUser)) };
}

export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let currentUsers = await getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === uid);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  // Prevent deletion of a specific user, e.g., the main admin
  if (currentUsers[userIndex].email === "jesus@mobyland.com.ar") {
    return { success: false, message: "No se puede eliminar al administrador principal." };
  }

  const deletedUserEmail = currentUsers[userIndex].email;
  currentUsers.splice(userIndex, 1);
  await updateAllMockUsers(currentUsers); // Use await
  await deleteMockPassword(deletedUserEmail); // Use await

  return { success: true, message: "Usuario eliminado exitosamente." };
}


export async function updateUserStatus(uid: string, status: UserStatus): Promise<{ success: boolean; message: string; user?: User }> {
  let currentUsers = await getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === uid);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  currentUsers[userIndex].status = status;
  currentUsers[userIndex].updatedAt = new Date().toISOString();
  await updateAllMockUsers(currentUsers); // Use await

  const message = status === 'active' ? 'Usuario aprobado exitosamente.' :
                  status === 'denied' ? 'Usuario denegado exitosamente.' :
                  'Estado de usuario actualizado.';
  
  return { success: true, message, user: JSON.parse(JSON.stringify(currentUsers[userIndex])) };
}
