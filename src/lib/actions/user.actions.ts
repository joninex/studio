// src/lib/actions/user.actions.ts
"use server";

import type { User, UserStatus, UserRole } from "@/types";
import { UserSchema } from "@/lib/schemas";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { Timestamp } from 'firebase-admin/firestore';
import type { z } from "zod";

// Constantes y mocks eliminados
// Funciones de backup/restore eliminadas.
// verifyUserPassword eliminada.

function mapFirestoreDocToUser(doc: FirebaseFirestore.DocumentSnapshot): User | null {
    if (!doc.exists) return null;
    const data = doc.data() as any;
    return {
        uid: doc.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        role: data.role,
        status: data.status,
        assignments: data.assignments || [],
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
}

export async function getUserById(uid: string): Promise<User | undefined> {
  if (!uid) {
    console.warn("getUserById: uid no proporcionado.");
    return undefined;
  }
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    return mapFirestoreDocToUser(userDoc) ?? undefined;
  } catch (error) {
    console.error(`Error fetching user by ID ${uid}:`, error);
    return undefined;
  }
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  // Username en este sistema es el email.
  if (!username) {
    console.warn("getUserByUsername: username (email) no proporcionado.");
    return undefined;
  }
  try {
    const userRecord = await adminAuth.getUserByEmail(username);
    if (!userRecord || !userRecord.uid) {
      return undefined;
    }
    return await getUserById(userRecord.uid);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // No es un error necesariamente, simplemente el usuario no existe en Auth.
      // console.log(`User with email ${username} not found in Firebase Auth.`);
    } else {
      console.error(`Error fetching user by email ${username} from Firebase Auth:`, error);
    }
    return undefined;
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const snapshot = await adminDb.collection('users').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => mapFirestoreDocToUser(doc)).filter(Boolean) as User[];
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getTechnicians(): Promise<User[]> {
  try {
    const snapshot = await adminDb.collection('users')
      .where('role', '==', 'tecnico')
      .where('status', '==', 'active')
      .get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => mapFirestoreDocToUser(doc)).filter(Boolean) as User[];
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return [];
  }
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
   try {
    const snapshot = await adminDb.collection('users')
      .where('role', '==', role)
      .get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => mapFirestoreDocToUser(doc)).filter(Boolean) as User[];
  } catch (error) {
    console.error(`Error fetching users by role ${role}:`, error);
    return [];
  }
}

export async function createUser(values: z.infer<typeof UserSchema>): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = UserSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Validation errors for createUser:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de usuario inválidos." };
  }

  const { email, password, name, role, avatarUrl, sector } = validatedFields.data;

  if (!password) { 
    return { success: false, message: "La contraseña es requerida para nuevos usuarios." };
  }

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      photoURL: avatarUrl || undefined,
    });

    const now = Timestamp.now();
    const userProfileData = {
      email,
      name,
      avatarUrl: userRecord.photoURL || avatarUrl || `https://i.pravatar.cc/150?u=${email}`,
      role,
      status: "active",
      assignments: [{ branchId: 'B001', role: role, sector: sector || 'Asignación General' }],
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userProfileData);

    const createdUser: User = {
      uid: userRecord.uid,
      ...userProfileData,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };

    return { success: true, message: "Usuario creado exitosamente.", user: createdUser };

  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    if (error.code === 'auth/email-already-exists') {
      return { success: false, message: "El email ya está registrado en Firebase Authentication." };
    }
    return { success: false, message: error.message || "Ocurrió un error al crear el usuario." };
  }
}

export async function updateUser(uid: string, values: Partial<Omit<z.infer<typeof UserSchema>, 'password'>> & { password?: string }): Promise<{ success: boolean; message: string; user?: User }> {
  
  if (!uid) return { success: false, message: "UID de usuario no proporcionado." };

  const { email, password, name, role, avatarUrl, sector, ...otherProfileData } = values;
  const now = Timestamp.now();
  const userProfileUpdate: any = { ...otherProfileData, updatedAt: now };
  const authUpdate: any = {};

  try {
    const existingUserAuth = await adminAuth.getUser(uid);

    if (email && email !== existingUserAuth.email) authUpdate.email = email;
    if (password && password.trim() !== "") authUpdate.password = password;
    if (name && name !== existingUserAuth.displayName) authUpdate.displayName = name;
    if (avatarUrl !== undefined && avatarUrl !== existingUserAuth.photoURL) authUpdate.photoURL = avatarUrl || null;

    if (Object.keys(authUpdate).length > 0) {
      await adminAuth.updateUser(uid, authUpdate);
    }

    if (email && email !== existingUserAuth.email) userProfileUpdate.email = email;
    if (name && name !== existingUserAuth.displayName) userProfileUpdate.name = name;
    if (avatarUrl !== undefined && avatarUrl !== existingUserAuth.photoURL) userProfileUpdate.avatarUrl = avatarUrl || null;
    if (role) userProfileUpdate.role = role;

    if (role || sector) {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const existingAssignments = userDoc.data()?.assignments || [];
        if (existingAssignments.length > 0) {
            const currentAssignment = { ...existingAssignments[0] };
            if(role) currentAssignment.role = role;
            if(sector !== undefined) currentAssignment.sector = sector;
            userProfileUpdate.assignments = [currentAssignment, ...existingAssignments.slice(1)];
        } else if (role) {
             userProfileUpdate.assignments = [{ branchId: 'B001', role: role, sector: sector || 'General' }];
        }
    }

    let hasProfileUpdates = false;
    for(const key in userProfileUpdate){
        if(key !== 'updatedAt' && userProfileUpdate[key] !== undefined){
            hasProfileUpdates = true;
            break;
        }
    }

    if (hasProfileUpdates) {
      await adminDb.collection('users').doc(uid).update(userProfileUpdate);
    } else if (Object.keys(authUpdate).length > 0) {
      // If only auth was updated, still update 'updatedAt' in Firestore
      await adminDb.collection('users').doc(uid).update({updatedAt: now});
    }

    const updatedUserDoc = await adminDb.collection('users').doc(uid).get();
    const finalUser = mapFirestoreDocToUser(updatedUserDoc);

    return { success: true, message: "Usuario actualizado exitosamente.", user: finalUser ?? undefined };

  } catch (error: any) {
    console.error(`Error al actualizar usuario ${uid}:`, error);
    if (error.code === 'auth/email-already-exists') {
      return { success: false, message: "El nuevo email ya está en uso por otro usuario." };
    }
    return { success: false, message: error.message || "Ocurrió un error al actualizar el usuario." };
  }
}

export async function deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
  if (!uid) return { success: false, message: "UID de usuario no proporcionado." };
  try {
    await adminAuth.deleteUser(uid);
    await adminDb.collection('users').doc(uid).delete();

    return { success: true, message: "Usuario eliminado exitosamente." };
  } catch (error: any) {
    console.error(`Error al eliminar usuario ${uid}:`, error);
    if (error.code === 'auth/user-not-found') {
        try {
            await adminDb.collection('users').doc(uid).delete();
            return { success: true, message: "Usuario eliminado de Firestore (no encontrado en Auth)." };
        } catch (dbError) {
            console.error(`Error al eliminar usuario ${uid} de Firestore tras no encontrarlo en Auth:`, dbError);
        }
    }
    return { success: false, message: error.message || "Error al eliminar el usuario." };
  }
}

export async function updateUserStatus(uid: string, status: UserStatus): Promise<{ success: boolean; message: string; user?: User }> {
  if (!uid) return { success: false, message: "UID de usuario no proporcionado." };
  try {
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.update({ status: status, updatedAt: Timestamp.now() });

    const updatedUserDoc = await userRef.get();
    const finalUser = mapFirestoreDocToUser(updatedUserDoc);

    const message = status === 'active' ? 'Usuario aprobado/activado exitosamente.' :
                  status === 'denied' ? 'Usuario denegado exitosamente.' :
                  'Estado de usuario actualizado.';

    return { success: true, message, user: finalUser ?? undefined };
  } catch (error: any) {
    console.error(`Error al actualizar estado del usuario ${uid}:`, error);
    return { success: false, message: error.message || "Error al actualizar estado del usuario." };
  }
}
