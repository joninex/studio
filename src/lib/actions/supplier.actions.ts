// src/lib/actions/supplier.actions.ts
"use server";

import type { Supplier } from "@/types";
import { SupplierSchema, type SupplierFormData } from "@/lib/schemas";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from 'firebase-admin/firestore';

// Mocks y funciones de backup/restore eliminados

function mapFirestoreDocToSupplier(doc: FirebaseFirestore.DocumentSnapshot): Supplier | null {
    if (!doc.exists) return null;
    const data = doc.data() as any;
    return {
        id: doc.id,
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        cuit: data.cuit,
        sellsDescription: data.sellsDescription || "",
        notes: data.notes,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
}

export async function getSupplierById(supplierId: string): Promise<Supplier | null> {
    if (!supplierId) {
        console.warn("getSupplierById: supplierId no proporcionado.");
        return null;
    }
    try {
        const docRef = adminDb.collection('suppliers').doc(supplierId);
        const docSnap = await docRef.get();
        return mapFirestoreDocToSupplier(docSnap);
    } catch (error) {
        console.error(`Error al obtener proveedor por ID ${supplierId}:`, error);
        return null;
    }
}

export async function createSupplier(
  values: SupplierFormData
): Promise<{ success: boolean; message: string; supplier?: Supplier }> {
  const validatedFields = SupplierSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Supplier Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos del proveedor inválidos." };
  }

  const now = Timestamp.now();
  const newSupplierData = {
    ...validatedFields.data,
    sellsDescription: validatedFields.data.sellsDescription || "",
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await adminDb.collection('suppliers').add(newSupplierData);
    const createdSupplier: Supplier = {
      id: docRef.id,
      ...newSupplierData,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
    return { success: true, message: "Proveedor creado exitosamente.", supplier: createdSupplier };
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    return { success: false, message: "Ocurrió un error al crear el proveedor." };
  }
}

export async function updateSupplier(
  supplierId: string,
  values: SupplierFormData
): Promise<{ success: boolean; message: string; supplier?: Supplier }> {
  if (!supplierId) return { success: false, message: "ID de proveedor no proporcionado."};

  const validatedFields = SupplierSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Supplier Update Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos del proveedor inválidos para actualizar." };
  }

  const supplierRef = adminDb.collection('suppliers').doc(supplierId);
  const now = Timestamp.now();
  const updateData = {
      ...validatedFields.data,
      sellsDescription: validatedFields.data.sellsDescription || "",
      updatedAt: now,
  };
  Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);

  try {
    const docSnap = await supplierRef.get();
    if (!docSnap.exists) {
        return { success: false, message: "Proveedor no encontrado." };
    }
    await supplierRef.update(updateData);
    const updatedDoc = await supplierRef.get();
    return { success: true, message: "Proveedor actualizado exitosamente.", supplier: mapFirestoreDocToSupplier(updatedDoc) ?? undefined };
  } catch (error) {
    console.error(`Error al actualizar proveedor ${supplierId}:`, error);
    return { success: false, message: "Ocurrió un error al actualizar el proveedor." };
  }
}

export async function deleteSupplier(supplierId: string): Promise<{ success: boolean; message: string }> {
  if (!supplierId) return { success: false, message: "ID de proveedor no proporcionado."};
  try {
    const supplierRef = adminDb.collection('suppliers').doc(supplierId);
    const docSnap = await supplierRef.get();
    if (!docSnap.exists) {
        return { success: false, message: "Proveedor no encontrado." };
    }
    await supplierRef.delete();
    return { success: true, message: "Proveedor eliminado exitosamente." };
  } catch (error) {
    console.error(`Error al eliminar proveedor ${supplierId}:`, error);
    return { success: false, message: "Ocurrió un error al eliminar el proveedor." };
  }
}

export async function getSuppliers(filters?: {
  name?: string;
  contactName?: string;
}): Promise<Supplier[]> {
  try {
    let query: admin.firestore.Query = adminDb.collection('suppliers');

    if (filters?.name && filters.name.trim() !== "") {
      const nameSearch = filters.name.trim();
      query = query.where('name', '>=', nameSearch).where('name', '<=', nameSearch + '\uf8ff');
    }
    if (filters?.contactName && filters.contactName.trim() !== "") {
      const contactNameSearch = filters.contactName.trim();
      query = query.where('contactName', '>=', contactNameSearch).where('contactName', '<=', contactNameSearch + '\uf8ff');
    }

    query = query.orderBy('name', 'asc');

    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => mapFirestoreDocToSupplier(doc)).filter(Boolean) as Supplier[];
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    return [];
  }
}
