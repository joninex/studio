// src/lib/actions/part.actions.ts
"use server";

import type { Part, PartCategory } from "@/types";
import { PartSchema, type PartFormData } from "@/lib/schemas";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Mock database and related functions are no longer needed
// --- Funciones para Backup y Restauración ---
/*
export async function getRawPartData() {
  // ...
}
export async function restorePartData(data: { parts: Part[]; counter: number }) {
  // ...
}
*/
// --- Fin Funciones para Backup y Restauración ---


export async function getPartById(partId: string): Promise<Part | null> {
  if (!partId) {
    console.log("getPartById: partId is undefined or empty.");
    return null;
  }
  try {
    const docRef = adminDb.collection('parts').doc(partId);
    const docSnap = await docRef.get();

    if (!docSnap.exists()) {
      console.log(`Repuesto con ID ${partId} no encontrado.`);
      return null;
    }

    const data = docSnap.data();
    const part: Part = {
      id: docSnap.id,
      name: data?.name,
      sku: data?.sku,
      description: data?.description,
      category: data?.category,
      unit: data?.unit,
      costPrice: data?.costPrice,
      salePrice: data?.salePrice,
      stock: data?.stock,
      minStock: data?.minStock,
      supplierInfo: data?.supplierInfo,
      notes: data?.notes,
      imageUrl: data?.imageUrl,
      createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data?.createdAt,
      updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
    };
    return part;
  } catch (error) {
    console.error(`Error al obtener repuesto por ID ${partId}:`, error);
    return null;
  }
}

export async function updatePartStock(partId: string, quantityChange: number): Promise<{ success: boolean; message?: string; newStock?: number }> {
  if (!partId) {
    return { success: false, message: "ID de repuesto no proporcionado." };
  }
  if (typeof quantityChange !== 'number' || isNaN(quantityChange)) {
    return { success: false, message: "El cambio de cantidad debe ser un número."};
  }

  const partRef = adminDb.collection('parts').doc(partId);

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const partDoc = await transaction.get(partRef);
      if (!partDoc.exists) {
        throw new Error(`Repuesto con ID ${partId} no encontrado.`); // Lanzar error para abortar transacción
      }

      const currentStock = partDoc.data()?.stock || 0;
      const newStockValue = currentStock + quantityChange;

      if (newStockValue < 0) {
        throw new Error(`Stock insuficiente para ${partDoc.data()?.name}. Stock actual: ${currentStock}, se necesitan ${Math.abs(quantityChange)}.`);
      }

      transaction.update(partRef, {
        stock: newStockValue,
        updatedAt: Timestamp.now()
      });
      return newStockValue; // Devolver el nuevo stock desde la transacción
    });

    return { success: true, message: "Stock actualizado correctamente.", newStock: result };

  } catch (error: any) {
    console.error(`Error al actualizar stock para repuesto ${partId}:`, error);
    return { success: false, message: error.message || "Error desconocido durante la transacción de stock." };
  }
}


export async function createPart(values: PartFormData): Promise<{ success: boolean; message: string; part?: Part }> {
  const validatedFields = PartSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Part Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos del repuesto inválidos." };
  }
  try {
    const now = Timestamp.now();
    const newPartData = {
      ...validatedFields.data,
      // Asegurarse de que el stock tenga un valor por defecto si no se proporciona
      stock: typeof validatedFields.data.stock === 'number' ? validatedFields.data.stock : 0,
      minStock: typeof validatedFields.data.minStock === 'number' ? validatedFields.data.minStock : 0,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await adminDb.collection('parts').add(newPartData);
    const createdPart: Part = {
      id: docRef.id,
      ...newPartData,
      // Convertir Timestamps a ISO strings para el objeto de retorno
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
    return { success: true, message: "Repuesto creado exitosamente.", part: createdPart };
  } catch (error) {
    console.error("Error al crear repuesto:", error);
    return { success: false, message: "Error al crear el repuesto en la base de datos."};
  }
}

export async function updatePart(partId: string, values: PartFormData): Promise<{ success: boolean; message: string; part?: Part }> {
  if (!partId) {
    return { success: false, message: "ID de repuesto no proporcionado." };
  }
  const validatedFields = PartSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Part Update Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos del repuesto inválidos para actualizar." };
  }

  try {
    const partRef = adminDb.collection('parts').doc(partId);
    const docSnap = await partRef.get();

    if (!docSnap.exists()) {
      return { success: false, message: "Repuesto no encontrado." };
    }

    const updateData = {
      ...validatedFields.data,
      updatedAt: Timestamp.now(),
    };
    await partRef.update(updateData);

    const updatedDocSnap = await partRef.get(); // Obtener el documento actualizado
    const updatedData = updatedDocSnap.data();

    const originalData = docSnap.data(); // Para mantener createdAt original

    const updatedPart: Part = {
      id: updatedDocSnap.id,
      name: updatedData?.name,
      sku: updatedData?.sku,
      description: updatedData?.description,
      category: updatedData?.category,
      unit: updatedData?.unit,
      costPrice: updatedData?.costPrice,
      salePrice: updatedData?.salePrice,
      stock: updatedData?.stock,
      minStock: updatedData?.minStock,
      supplierInfo: updatedData?.supplierInfo,
      notes: updatedData?.notes,
      imageUrl: updatedData?.imageUrl,
      createdAt: originalData?.createdAt instanceof Timestamp ? originalData.createdAt.toDate().toISOString() : originalData?.createdAt,
      updatedAt: updatedData?.updatedAt instanceof Timestamp ? updatedData.updatedAt.toDate().toISOString() : updatedData?.updatedAt,
    };

    return { success: true, message: "Repuesto actualizado exitosamente.", part: updatedPart };
  } catch (error) {
    console.error(`Error al actualizar repuesto ${partId}:`, error);
    return { success: false, message: "Error al actualizar el repuesto." };
  }
}

export async function deletePart(partId: string): Promise<{ success: boolean; message: string }> {
   if (!partId) {
    return { success: false, message: "ID de repuesto no proporcionado." };
  }
  try {
    // TODO (Futuro): Considerar verificar si el repuesto está en uso en alguna orden antes de eliminar.
    // Esto requeriría una consulta a la colección de órdenes que usen este partId en su array partsUsed.
    const partRef = adminDb.collection('parts').doc(partId);
    const docSnap = await partRef.get();

    if (!docSnap.exists()) {
      return { success: false, message: "Repuesto no encontrado para eliminar." };
    }

    await partRef.delete();
    return { success: true, message: "Repuesto eliminado exitosamente." };
  } catch (error) {
     console.error(`Error al eliminar repuesto ${partId}:`, error);
    return { success: false, message: "Error al eliminar el repuesto." };
  }
}

export async function getParts(filters?: { name?: string; sku?: string; category?: PartCategory; }): Promise<Part[]> {
  try {
    let query: admin.firestore.Query = adminDb.collection('parts');

    // Aplicar filtros
    // Nota: Firestore es sensible a mayúsculas/minúsculas por defecto.
    // Para búsquedas insensibles o "contiene", se necesitarían estrategias más avanzadas
    // (ej. campo normalizado en minúsculas, o servicio de búsqueda externo).

    if (filters?.name && filters.name.trim() !== "") {
      const nameSearch = filters.name.trim();
      query = query.where('name', '>=', nameSearch).where('name', '<=', nameSearch + '\uf8ff');
    }
    if (filters?.sku && filters.sku.trim() !== "") {
      query = query.where('sku', '==', filters.sku.trim());
    }
    if (filters?.category && filters.category !== "") {
      query = query.where('category', '==', filters.category);
    }

    // Ordenación por defecto
    query = query.orderBy('name', 'asc');
    // Alternativa: ordenar por fecha de creación
    // query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        sku: data.sku,
        description: data.description,
        category: data.category,
        unit: data.unit,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        stock: data.stock,
        minStock: data.minStock,
        supplierInfo: data.supplierInfo,
        notes: data.notes,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Part; // Es importante asegurar que el objeto devuelto coincida con la interfaz Part
    });
  } catch (error) {
    console.error("Error al obtener repuestos:", error);
    // En caso de error (ej. índice faltante para una consulta compleja), devolver array vacío.
    return [];
  }
}
