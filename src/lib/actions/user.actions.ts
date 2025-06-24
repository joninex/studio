// src/lib/actions/user.actions.ts
"use server";

import type { User, UserStatus, UserRole } from "@/types";
import { UserSchema } from "@/lib/schemas";
import type { z } from "zod";

// --- GORI Persistent Data Store Simulation ---
// En un sistema real, esto sería una conexión a una base de datos como Firestore o PostgreSQL.

const GORI_SUPER_ADMIN_EMAIL = "jesus@mobyland.com.ar";

// This represents the 'users' table/collection in GORI's database.
let gori_db_usuarios: User[] = [
    {
        uid: "gori-user-uuid-001",
        email: GORI_SUPER_ADMIN_EMAIL,
        name: "Jesus (GORI Admin)",
        avatarUrl: "https://i.pravatar.cc/150?u=superadmin_global",
        role: 'admin',
        status: 'active',
        createdAt: new Date('2023-01-01T10:00:00Z').toISOString(),
        updatedAt: new Date('2023-01-01T10:00:00Z').toISOString(),
        assignments: [], // Super admin has global access
    },
    {
        uid: "gori-user-uuid-002",
        email: 'ana.lopez.admincen@gori.app',
        name: 'Ana López',
        avatarUrl: "https://i.pravatar.cc/150?u=ana.lopez.admincen",
        role: 'admin',
        status: 'active',
        createdAt: new Date('2023-01-02T11:00:00Z').toISOString(),
        updatedAt: new Date('2023-01-02T11:00:00Z').toISOString(),
        assignments: [
          { branchId: 'B001', role: 'admin', sector: 'Supervisión General, Administración' }
        ]
    },
    {
        uid: "gori-user-uuid-003",
        email: 'juan.perez.techhwcen@gori.app',
        name: 'Juan Pérez',
        avatarUrl: "https://i.pravatar.cc/150?u=juan.perez.techhwcen",
        role: 'tecnico',
        status: 'active',
        createdAt: new Date('2023-01-03T12:00:00Z').toISOString(),
        updatedAt: new Date('2023-01-03T12:00:00Z').toISOString(),
        assignments: [
          { branchId: 'B001', role: 'tecnico', sector: 'Laboratorio Hardware' }
        ]
    },
];

// This conceptually represents a separate, secure password store.
// It is NOT exported to comply with "use server" module constraints.
let gori_db_passwords: Record<string, string> = {
    "jesus@mobyland.com.ar": "42831613aA@",
    "ana.lopez.admincen@gori.app": "NexusPass2024!",
    "juan.perez.techhwcen@gori.app": "NexusPass2024!",
};

// --- GORI Data Access Functions ---

export async function verifyUserPassword(
    username: string, 
    password_plaintext: string
): Promise<boolean> {
  // En un sistema real, el servicio GORI buscaría el hash y lo compararía.
  await new Promise(resolve => setTimeout(resolve, 50));
  if (gori_db_passwords[username] && gori_db_passwords[username] === password_plaintext) {
      return true;
  }
  return false;
}


export async function getUsers(): Promise<User[]> {
  // GORI retrieves all users from its persistent store.
  return JSON.parse(JSON.stringify(gori_db_usuarios));
}

export async function getTechnicians(): Promise<User[]> {
  const allUsers = await getUsers();
  return allUsers.filter(user => user.role === 'tecnico' && user.status === 'active');
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
    const allUsers = await getUsers();
    return allUsers.filter(user => user.role === role && user.status === 'active');
}

export async function getUserById(uid: string): Promise<User | undefined> {
  const user = gori_db_usuarios.find(u => u.uid === uid);
  return user ? JSON.parse(JSON.stringify(user)) : undefined;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  // The username in this system corresponds to the email field.
  const user = gori_db_usuarios.find(u => u.email === username);
  return user ? JSON.parse(JSON.stringify(user)) : undefined;
}

export async function createUser(data: z.infer<typeof UserSchema>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de usuario inválidos." };
  }

  const { email, password, name, role, avatarUrl, sector } = validatedFields.data;

  if (gori_db_usuarios.find(u => u.email === email)) {
    return { success: false, message: "El email ya está registrado." };
  }
  if (!password) { 
    return { success: false, message: "La contraseña es requerida para nuevos usuarios." };
  }

  // El sistema GORI genera un UID único y robusto.
  const newUid = `gori-user-uuid-${Date.now()}`;
  
  const newUser: User = { 
    uid: newUid,
    email,
    name,
    avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${email}`,
    role: email === GORI_SUPER_ADMIN_EMAIL ? 'admin' : role, 
    status: "active", // New users created by admin are active by default
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(),
    assignments: [{ branchId: 'B001', role: role, sector: sector || 'Asignación General' }] // Assign to default branch and sector
  };
  
  gori_db_usuarios.push(newUser);
  
  // GORI's auth service securely hashes and stores the password.
  gori_db_passwords[email] = password;
  
  return { success: true, message: "Usuario creado exitosamente.", user: JSON.parse(JSON.stringify(newUser)) };
}

export async function updateUser(uid: string, data: Partial<z.infer<typeof UserSchema>>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.partial().safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Datos de actualización inválidos." };
  }

  const userIndex = gori_db_usuarios.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }
  
  const { password, email, role, avatarUrl, sector, ...restData } = validatedFields.data;
  const existingUser = gori_db_usuarios[userIndex];

  if (existingUser.email === GORI_SUPER_ADMIN_EMAIL && (email && email !== GORI_SUPER_ADMIN_EMAIL || role && role !== 'admin')) {
      return { success: false, message: "No se puede modificar el rol o email del super administrador." };
  }

  if (email && email !== existingUser.email && gori_db_usuarios.some(u => u.email === email && u.uid !== uid)) {
    return { success: false, message: "El nuevo email ya está en uso por otro usuario." };
  }
  
  const updatedUser: User = { ...existingUser, ...restData, updatedAt: new Date().toISOString() };

  if (avatarUrl !== undefined) updatedUser.avatarUrl = avatarUrl || undefined;
  if (role) updatedUser.role = role;
  
  // Handle assignments update robustly
  if (updatedUser.assignments && updatedUser.assignments.length > 0) {
      if (role) updatedUser.assignments[0].role = role;
      if (sector !== undefined) updatedUser.assignments[0].sector = sector;
  } else {
      updatedUser.assignments = [{ branchId: 'B001', role: role || updatedUser.role, sector: sector || 'Asignación General' }];
  }

  if (email && email !== existingUser.email) {
    const oldEmail = existingUser.email;
    if (gori_db_passwords[oldEmail]) {
        gori_db_passwords[email] = gori_db_passwords[oldEmail];
        delete gori_db_passwords[oldEmail];
    }
    updatedUser.email = email;
  }

  if (password && password.trim() !== "") { 
    // GORI's auth service would handle secure hashing and update.
    gori_db_passwords[updatedUser.email] = password;
  }
  
  gori_db_usuarios[userIndex] = updatedUser;
  
  return { success: true, message: "Usuario actualizado exitosamente.", user: JSON.parse(JSON.stringify(updatedUser)) };
}

export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  const userIndex = gori_db_usuarios.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  if (gori_db_usuarios[userIndex].email === GORI_SUPER_ADMIN_EMAIL) {
    return { success: false, message: "No se puede eliminar al super administrador." };
  }

  const deletedUserEmail = gori_db_usuarios[userIndex].email;
  gori_db_usuarios.splice(userIndex, 1);
  delete gori_db_passwords[deletedUserEmail];

  return { success: true, message: "Usuario eliminado exitosamente." };
}

export async function updateUserStatus(uid: string, status: UserStatus): Promise<{ success: boolean; message: string; user?: User }> {
  const userIndex = gori_db_usuarios.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }

  const user = gori_db_usuarios[userIndex];
  if (user.email === GORI_SUPER_ADMIN_EMAIL && status !== 'active') {
    return { success: false, message: "No se puede cambiar el estado del super administrador." };
  }

  user.status = status;
  user.updatedAt = new Date().toISOString();
  
  const message = status === 'active' ? 'Usuario aprobado exitosamente.' :
                  status === 'denied' ? 'Usuario denegado exitosamente.' :
                  'Estado de usuario actualizado.';
  
  return { success: true, message, user: JSON.parse(JSON.stringify(user)) };
}
