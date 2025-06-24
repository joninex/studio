// src/lib/actions/user.actions.ts
"use server";

import type { User, UserStatus, UserRole } from "@/types";
import { UserSchema } from "@/lib/schemas";
import type { z } from "zod";
import { 
  getAllMockUsers, 
  updateAllMockUsers,
  getMockPasswords,
  setMockPassword,
  deleteMockPassword,
  getUserById
} from "./auth.actions"; 

const SUPER_ADMIN_EMAIL = "jesus@mobyland.com.ar";

export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); 
  return await getAllMockUsers();
}

export async function getTechnicians(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const allUsers = await getAllMockUsers();
  return allUsers.filter(user => user.role === 'tecnico' && user.status === 'active');
}

// New function to get users by a specific role
export async function getUsersByRole(role: UserRole): Promise<User[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const allUsers = await getAllMockUsers();
    // This is a simplified check. A real app would check assignments for multi-branch roles.
    return allUsers.filter(user => user.role === role && user.status === 'active');
}


export async function createUser(data: z.infer<typeof UserSchema>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de usuario inválidos." };
  }

  const { email, password, name, role, avatarUrl } = validatedFields.data;
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
    avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${email}`,
    role: email === SUPER_ADMIN_EMAIL ? 'admin' : role, 
    status: "active", // New users created by admin are active by default
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(),
    assignments: [{ branchId: 'B001', role: role, sector: 'Asignación General' }] // Assign to default branch and sector
  };
  const updatedUsers = [...currentUsers, newUser];
  await updateAllMockUsers(updatedUsers);
  await setMockPassword(email, password);
  
  return { success: true, message: "Usuario creado exitosamente.", user: JSON.parse(JSON.stringify(newUser)) };
}

export async function updateUser(uid: string, data: Partial<z.infer<typeof UserSchema>>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.partial().safeParse(data);
  if (!validatedFields.success) {
    console.error("Update User Validation Error:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de actualización inválidos." };
  }

  const currentUsers = await getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }
  
  await new Promise(resolve => setTimeout(resolve, 300));

  const { password, email, role, avatarUrl, ...restData } = validatedFields.data;
  const existingUser = currentUsers[userIndex];

  if (existingUser.email === SUPER_ADMIN_EMAIL) {
    if (email && email !== SUPER_ADMIN_EMAIL) {
      return { success: false, message: "No se puede cambiar el email del super administrador." };
    }
    if (role && role !== 'admin') {
      return { success: false, message: "No se puede cambiar el rol del super administrador." };
    }
  }

  if (email && email !== existingUser.email && currentUsers.some(u => u.email === email && u.uid !== uid)) {
    return { success: false, message: "El nuevo email ya está en uso por otro usuario." };
  }
  
  const updatedUser: User = { 
    ...existingUser, 
    ...restData,
    name: validatedFields.data.name ?? existingUser.name, 
    avatarUrl: avatarUrl === undefined ? existingUser.avatarUrl : (avatarUrl || undefined), 
    role: (existingUser.email === SUPER_ADMIN_EMAIL) ? 'admin' : (role || existingUser.role), 
    email: (existingUser.email === SUPER_ADMIN_EMAIL) ? SUPER_ADMIN_EMAIL : (email || existingUser.email), 
    updatedAt: new Date().toISOString() 
  };
  
  if (email && email !== existingUser.email && existingUser.email !== SUPER_ADMIN_EMAIL) {
    const oldEmail = existingUser.email;
    const currentPasswords = await getMockPasswords();
    if (currentPasswords[oldEmail]) {
        await setMockPassword(email, currentPasswords[oldEmail]); 
        await deleteMockPassword(oldEmail); 
    }
    updatedUser.email = email;
  }

  if (password && password.trim() !== "") { 
    await setMockPassword(updatedUser.email, password); 
  }
  
  currentUsers[userIndex] = updatedUser;
  await updateAllMockUsers(currentUsers); 
  
  return { success: true, message: "Usuario actualizado exitosamente.", user: JSON.parse(JSON.stringify(updatedUser)) };
}

export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let currentUsers = await getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === uid);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  if (currentUsers[userIndex].email === SUPER_ADMIN_EMAIL) {
    return { success: false, message: "No se puede eliminar al super administrador." };
  }

  const deletedUserEmail = currentUsers[userIndex].email;
  currentUsers.splice(userIndex, 1);
  await updateAllMockUsers(currentUsers); 
  await deleteMockPassword(deletedUserEmail); 

  return { success: true, message: "Usuario eliminado exitosamente." };
}


export async function updateUserStatus(uid: string, status: UserStatus): Promise<{ success: boolean; message: string; user?: User }> {
  let currentUsers = await getAllMockUsers();
  const userIndex = currentUsers.findIndex(u => u.uid === uid);

  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  if (currentUsers[userIndex].email === SUPER_ADMIN_EMAIL && status !== 'active') {
    return { success: false, message: "No se puede cambiar el estado del super administrador." };
  }

  currentUsers[userIndex].status = status;
  currentUsers[userIndex].updatedAt = new Date().toISOString();
  await updateAllMockUsers(currentUsers); 

  const message = status === 'active' ? 'Usuario aprobado exitosamente.' :
                  status === 'denied' ? 'Usuario denegado exitosamente.' :
                  'Estado de usuario actualizado.';
  
  return { success: true, message, user: JSON.parse(JSON.stringify(currentUsers[userIndex])) };
}
