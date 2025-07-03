// src/lib/actions/commonFaults.actions.ts
"use server";

import type { CommonFault } from "@/types";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from 'firebase-admin/firestore';
// COMMON_FAULTS_DATA ya no se usa para inicializar mocks.
// Podría usarse para una función de "seed" si es necesario.
// import { COMMON_FAULTS_DATA } from "@/lib/data/common-faults";

function mapFirestoreDocToCommonFault(doc: FirebaseFirestore.DocumentSnapshot): CommonFault | null {
    if (!doc.exists) return null;
    const data = doc.data() as any; // Considerar un tipo más específico si es posible
    return {
        id: doc.id,
        activator: data.activator,
        category: data.category,
        fullText: data.fullText,
        keywords: data.keywords || [],
        // Ejemplo si se añaden timestamps:
        // createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        // updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
}

export async function getCommonFaults(query?: string): Promise<CommonFault[]> {
    try {
        let firestoreQuery: admin.firestore.Query = adminDb.collection('commonFaults');

        if (query && query.trim() !== "") {
            const lowerCaseQuery = query.trim().toLowerCase();
            // Búsqueda simplificada: 'activator' comienza con el query.
            // Para búsquedas más complejas (ej. en fullText o keywords array con 'contiene'),
            // se necesitarían estrategias diferentes (ej. Algolia, o campos de búsqueda normalizados).
            firestoreQuery = firestoreQuery
                .where('activator', '>=', lowerCaseQuery) // Firestore es sensible a mayúsculas/minúsculas por defecto
                .where('activator', '<=', lowerCaseQuery + '\uf8ff');

            // Para buscar en 'keywords' (array) por un término exacto:
            // firestoreQuery = firestoreQuery.where('keywords', 'array-contains', lowerCaseQuery);
            // Esto requiere que el 'query' sea una de las palabras clave.
        }

        firestoreQuery = firestoreQuery.orderBy('activator', 'asc');

        const snapshot = await firestoreQuery.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => mapFirestoreDocToCommonFault(doc)).filter(Boolean) as CommonFault[];
    } catch (error) {
        console.error("Error al obtener fallas comunes:", error);
        return [];
    }
}

export async function createCommonFault(data: Omit<CommonFault, 'id'>): Promise<CommonFault> {
  // Podría añadirse validación con Zod aquí si se define un CommonFaultSchema.
  const now = Timestamp.now(); // Si se usan createdAt/updatedAt
  const newFaultData = {
    ...data,
    keywords: data.keywords || [],
    // createdAt: now, // Descomentar si se añaden estos campos a la interfaz y Firestore
    // updatedAt: now,
  };

  try {
    const docRef = await adminDb.collection('commonFaults').add(newFaultData);
    const createdFault: CommonFault = {
      id: docRef.id,
      ...newFaultData,
      // createdAt: now.toDate().toISOString(), // Descomentar
      // updatedAt: now.toDate().toISOString(), // Descomentar
    };
    return createdFault;
  } catch (error) {
    console.error("Error al crear falla común:", error);
    throw error; // Propagar el error para que el llamador lo maneje
  }
}

export async function updateCommonFault(id: string, data: Partial<Omit<CommonFault, 'id'>>): Promise<CommonFault | null> {
  if (!id) {
      console.warn("updateCommonFault: ID no proporcionado.");
      return null;
  }
  // Podría añadirse validación con Zod aquí.
  const faultRef = adminDb.collection('commonFaults').doc(id);
  const updateData = {
      ...data,
      // updatedAt: Timestamp.now(), // Descomentar si se añade
  };
  // Eliminar campos undefined para que no se intenten escribir como tal en Firestore
  Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);


  try {
    const docSnap = await faultRef.get();
    if (!docSnap.exists) {
        console.warn(`updateCommonFault: Falla común con ID ${id} no encontrada.`);
        return null;
    }
    await faultRef.update(updateData);
    const updatedDoc = await faultRef.get();
    return mapFirestoreDocToCommonFault(updatedDoc);
  } catch (error) {
    console.error(`Error al actualizar falla común ${id}:`, error);
    return null;
  }
}

export async function deleteCommonFault(id: string): Promise<{ success: boolean }> {
  if (!id) {
      console.warn("deleteCommonFault: ID no proporcionado.");
      return { success: false };
  }
  try {
    const faultRef = adminDb.collection('commonFaults').doc(id);
    const docSnap = await faultRef.get();
    if (!docSnap.exists) {
        console.warn(`deleteCommonFault: Falla común con ID ${id} no encontrada.`);
        return { success: false };
    }
    await faultRef.delete();
    return { success: true };
  } catch (error) {
    console.error(`Error al eliminar falla común ${id}:`, error);
    return { success: false };
  }
}
