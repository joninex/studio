// src/lib/actions/branch.actions.ts
"use server";

import type { Branch, StoreSettings } from "@/types";
import { BranchSchema, StoreSettingsSchema } from "@/lib/schemas";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from 'firebase-admin/firestore';
import type { z } from "zod";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

// Mocks y funciones de backup/restore eliminados

function mapFirestoreDocToBranch(doc: FirebaseFirestore.DocumentSnapshot): Branch | null {
    if (!doc.exists) return null;
    const data = doc.data() as any;

    const settingsData = data.settings ? { ...DEFAULT_STORE_SETTINGS, ...data.settings, id: data.settings.id || `settings_${doc.id.toLowerCase()}` } :
                                      { ...DEFAULT_STORE_SETTINGS, id: `settings_${doc.id.toLowerCase()}`};

    return {
        id: doc.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        status: data.status,
        settings: settingsData,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
}

export async function getBranchById(branchId: string): Promise<Branch | null> {
    if (!branchId) {
        console.warn("getBranchById: branchId no proporcionado.");
        return null;
    }
    try {
        const docRef = adminDb.collection('branches').doc(branchId);
        const docSnap = await docRef.get();
        return mapFirestoreDocToBranch(docSnap);
    } catch (error) {
        console.error(`Error al obtener sucursal por ID ${branchId}:`, error);
        return null;
    }
}

export async function getBranches(): Promise<Branch[]> {
    try {
        const snapshot = await adminDb.collection('branches').orderBy('name', 'asc').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => mapFirestoreDocToBranch(doc)).filter(Boolean) as Branch[];
    } catch (error) {
        console.error("Error al obtener sucursales:", error);
        return [];
    }
}

export async function getSettingsForBranch(branchId: string): Promise<StoreSettings> {
    const branch = await getBranchById(branchId);
    if (branch && branch.settings) {
        return branch.settings;
    }
    console.warn(`Settings para sucursal ${branchId} no encontradas, usando defaults.`);
    return { ...DEFAULT_STORE_SETTINGS, id: `settings_default_${branchId}` };
}

export async function createBranch(values: z.infer<typeof BranchSchema>): Promise<{ success: boolean; message: string; branch?: Branch }> {
  const validatedFields = BranchSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Validation errors for createBranch:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de sucursal inválidos." };
  }
  
  const data = validatedFields.data;
  const now = Timestamp.now();

  try {
    // Crear settings iniciales para la nueva sucursal
    const initialSettings: StoreSettings = {
        ...DEFAULT_STORE_SETTINGS, // Comienza con los defaults globales
        // El ID de settings podría ser el mismo que el de la sucursal para fácil referencia, o uno único.
        // Por ahora, no le asignaremos un ID explícito aquí si se anida, Firestore no lo requiere para objetos anidados.
        // Si 'settings' fuera una colección separada, SÍ necesitaría un ID.
        // Como está anidado, el ID de 'DEFAULT_STORE_SETTINGS' se usará o se sobrescribirá.
        // Vamos a asegurarnos de que tenga un id único si es necesario para la lógica de la app:
        id: `settings_for_new_branch_${Date.now()}`, // O un UUID
        companyName: `G.O.R.I - ${data.name}`, // Personalizar algunos settings con datos de la sucursal
        companyAddress: data.address,
        branchInfo: data.name,
        // Los demás settings tomarán el valor de DEFAULT_STORE_SETTINGS
    };

    const newBranchData = {
      ...data,
      settings: initialSettings, // Anidar el objeto de settings completo
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('branches').add(newBranchData);

    const createdBranch: Branch = {
      id: docRef.id,
      ...newBranchData,
      settings: initialSettings, // Asegurar que el objeto devuelto también tenga los settings correctos
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
    return { success: true, message: "Sucursal creada exitosamente.", branch: createdBranch };

  } catch (error: any) {
    console.error("Error al crear sucursal:", error);
    return { success: false, message: error.message || "Ocurrió un error al crear la sucursal." };
  }
}

export async function updateBranch(branchId: string, values: z.infer<typeof BranchSchema>): Promise<{ success: boolean; message: string; branch?: Branch }> {
  if (!branchId) return { success: false, message: "ID de sucursal no proporcionado."};
  
  const validatedFields = BranchSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Validation errors for updateBranch:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de actualización inválidos." };
  }

  const data = validatedFields.data;
  const branchRef = adminDb.collection('branches').doc(branchId);
  const now = Timestamp.now();

  try {
    const branchDoc = await branchRef.get();
    if (!branchDoc.exists) {
      return { success: false, message: "Sucursal no encontrada." };
    }
    const existingSettings = (branchDoc.data() as Branch).settings || DEFAULT_STORE_SETTINGS;

    const branchUpdateData: Partial<Omit<Branch, 'id'|'settings'|'createdAt'>> & { settings?: Partial<StoreSettings>, updatedAt?: Timestamp } = {
      ...data, // name, address, phone, email, status de values
      updatedAt: now,
      // Actualizar campos específicos en settings si es necesario
      settings: {
        ...existingSettings, // Mantener settings existentes
        companyName: `G.O.R.I - ${data.name}`, // Actualizar basados en datos de la sucursal
        companyAddress: data.address,
        branchInfo: data.name,
      }
    };

    await branchRef.update(branchUpdateData);

    const updatedDoc = await branchRef.get();
    return { success: true, message: "Sucursal actualizada exitosamente.", branch: mapFirestoreDocToBranch(updatedDoc) ?? undefined };

  } catch (error: any) {
    console.error(`Error al actualizar sucursal ${branchId}:`, error);
    return { success: false, message: error.message || "Ocurrió un error al actualizar la sucursal." };
  }
}

export async function updateSettingsForBranch(
  branchId: string,
  values: z.infer<typeof StoreSettingsSchema>
): Promise<{ success: boolean; message: string; settings?: StoreSettings }> {
  if (!branchId) return { success: false, message: "ID de sucursal no proporcionado."};

  const validatedFields = StoreSettingsSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Store Settings Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de configuración de tienda inválidos." };
  }
  
  const branchRef = adminDb.collection('branches').doc(branchId);
  const now = Timestamp.now();

  try {
    const branchDoc = await branchRef.get();
    if (!branchDoc.exists) {
      return { success: false, message: "Sucursal no encontrada para actualizar configuración." };
    }

    // Fusionar los nuevos settings con los existentes para no perder campos no enviados
    const existingSettings = (branchDoc.data() as Branch).settings || DEFAULT_STORE_SETTINGS;
    const newSettings = { ...existingSettings, ...validatedFields.data, id: existingSettings.id }; // Mantener el ID original de settings

    await branchRef.update({
      settings: newSettings, // Actualizar el objeto settings completo
      updatedAt: now,
    });

    return {
      success: true,
      message: "Configuración de la sucursal guardada exitosamente.",
      settings: newSettings
    };

  } catch (error: any) {
    console.error(`Error al actualizar settings para sucursal ${branchId}:`, error);
    return { success: false, message: error.message || "Ocurrió un error al guardar la configuración." };
  }
}

export async function deleteBranch(branchId: string): Promise<{ success: boolean; message: string }> {
  if (!branchId) return { success: false, message: "ID de sucursal no proporcionado."};

  // TODO: Considerar validaciones antes de eliminar (ej. si es la última sucursal, si tiene órdenes asociadas).
  // Por ahora, se permite la eliminación directa.
  // const branches = await getBranches();
  // if (branches.length <= 1) {
  //   return { success: false, message: "No se puede eliminar la única sucursal existente." };
  // }

  try {
    const branchRef = adminDb.collection('branches').doc(branchId);
    const branchDoc = await branchRef.get();
    if (!branchDoc.exists) {
      return { success: false, message: "Sucursal no encontrada." };
    }

    await branchRef.delete();
    return { success: true, message: "Sucursal eliminada exitosamente." };

  } catch (error: any) {
    console.error(`Error al eliminar sucursal ${branchId}:`, error);
    return { success: false, message: error.message || "Ocurrió un error al eliminar la sucursal." };
  }
}
