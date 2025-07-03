// src/lib/actions/client.actions.ts
"use server";

import type { Client } from "@/types";
import { ClientSchema, type ClientFormData } from "@/lib/schemas";
import { adminDb } from "@/lib/firebase/admin"; // Importar adminDb
import { Timestamp } from 'firebase-admin/firestore'; // Para manejar Timestamps

// Ya no se necesitan mocks ni contadores de cliente

// --- Funciones para Backup y Restauración ---
// Estas funciones ya no son relevantes con Firestore y se pueden eliminar o comentar
/*
export async function getRawClientData() {
  // ...
}
export async function restoreClientData(data: { clients: Client[]; counter: number }) {
  // ...
}
*/
// --- Fin Funciones para Backup y Restauración ---

export async function getClientById(clientId: string): Promise<Client | null> {
  if (!clientId) {
    console.log("getClientById: clientId is undefined or empty.");
    return null;
  }
  try {
    const docRef = adminDb.collection('clients').doc(clientId);
    const docSnap = await docRef.get();

    if (!docSnap.exists()) {
      console.log(`Cliente con ID ${clientId} no encontrado.`);
      return null;
    }

    const data = docSnap.data();
    // Convertir Timestamps de Firestore a strings ISO para que coincidan con la interfaz Client
    // Asumimos que createdAt y updatedAt se almacenarán como Timestamps
    const client: Client = {
      id: docSnap.id,
      branchId: data?.branchId,
      name: data?.name,
      lastName: data?.lastName,
      dni: data?.dni,
      phone: data?.phone,
      phone2: data?.phone2,
      email: data?.email,
      address: data?.address,
      businessName: data?.businessName,
      cuit: data?.cuit,
      fiscalCondition: data?.fiscalCondition,
      notes: data?.notes,
      createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data?.createdAt,
      updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
    };
    return client;
  } catch (error) {
    console.error(`Error al obtener cliente por ID ${clientId}:`, error);
    return null;
  }
}

export async function createClient(values: ClientFormData, branchId: string): Promise<{ success: boolean; message: string; client?: Client }> {
  const validatedFields = ClientSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de cliente inválidos." };
  }

  try {
    const now = Timestamp.now(); // Usar Timestamp de Firestore para consistencia
    const newClientData = {
      ...validatedFields.data,
      branchId: branchId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('clients').add(newClientData);

    const createdClient: Client = {
      id: docRef.id,
      ...validatedFields.data, // Tomamos los datos validados que ya tienen el tipo correcto
      branchId: branchId,
      createdAt: now.toDate().toISOString(), // Convertir a ISO string para el objeto de retorno
      updatedAt: now.toDate().toISOString(), // Convertir a ISO string para el objeto de retorno
    };

    return { success: true, message: "Cliente creado exitosamente.", client: createdClient };
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return { success: false, message: "Error al crear el cliente en la base de datos." };
  }
}

export async function updateClient(clientId: string, values: ClientFormData): Promise<{ success: boolean; message: string; client?: Client }> {
  if (!clientId) {
    return { success: false, message: "ID de cliente no proporcionado." };
  }
  const validatedFields = ClientSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Validation Errors for updateClient:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos para actualizar inválidos." };
  }

  try {
    const docRef = adminDb.collection('clients').doc(clientId);
    const docSnap = await docRef.get();

    if (!docSnap.exists()) {
      return { success: false, message: "Cliente no encontrado." };
    }

    const updateData = {
      ...validatedFields.data,
      updatedAt: Timestamp.now(),
    };

    await docRef.update(updateData);

    // Obtener el documento actualizado para devolverlo
    const updatedDocSnap = await docRef.get();
    const updatedData = updatedDocSnap.data();

    const updatedClient: Client = {
      id: updatedDocSnap.id,
      branchId: updatedData?.branchId, // branchId no debería cambiar en una actualización de cliente
      name: updatedData?.name,
      lastName: updatedData?.lastName,
      dni: updatedData?.dni,
      phone: updatedData?.phone,
      phone2: updatedData?.phone2,
      email: updatedData?.email,
      address: updatedData?.address,
      businessName: updatedData?.businessName,
      cuit: updatedData?.cuit,
      fiscalCondition: updatedData?.fiscalCondition,
      notes: updatedData?.notes,
      // Asegurarse de que createdAt se mantenga y no se sobrescriba por validatedFields.data
      createdAt: docSnap.data()?.createdAt instanceof Timestamp ? (docSnap.data()?.createdAt as Timestamp).toDate().toISOString() : docSnap.data()?.createdAt,
      updatedAt: updatedData?.updatedAt instanceof Timestamp ? updatedData.updatedAt.toDate().toISOString() : updatedData?.updatedAt,
    };

    return { success: true, message: "Cliente actualizado exitosamente.", client: updatedClient };
  } catch (error) {
    console.error(`Error al actualizar cliente ${clientId}:`, error);
    return { success: false, message: "Error al actualizar el cliente en la base de datos." };
  }
}

export async function getClients(branchId: string, filters?: { search?: string }): Promise<Client[]> {
  if (!branchId) {
    console.error("getClients: branchId es requerido.");
    return [];
  }

  try {
    let query: admin.firestore.Query = adminDb.collection('clients').where('branchId', '==', branchId);

    const searchString = filters?.search?.trim().toLowerCase();

    // NOTA: Firestore es sensible a mayúsculas/minúsculas para las búsquedas.
    // Para búsquedas insensibles a mayúsculas/minúsculas más robustas, se necesitaría
    // almacenar una versión en minúsculas de los campos de búsqueda o usar un servicio de búsqueda externo.
    // Esta implementación es una aproximación simple.
    if (searchString) {
      // Esta es una limitación: no podemos hacer un OR fácil en múltiples campos "que contengan" o "empiecen con".
      // Se priorizará una búsqueda simple por nombre o DNI por ahora.
      // Si el string de búsqueda es numérico, asumimos que podría ser un DNI.
      if (/^\d+$/.test(searchString)) {
         query = query.where('dni', '==', searchString);
      } else if (searchString.includes('@')) {
         query = query.where('email', '==', searchString);
      } else {
        // Búsqueda "comienza con" para el nombre. Firestore no soporta "contiene" directamente.
        // Para apellidos, necesitaríamos otra consulta o almacenar nombre completo.
        // Dividimos el string de búsqueda por espacios para intentar buscar por nombre y apellido individualmente
        const searchTerms = searchString.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
          // Esta es una simplificación. Una búsqueda real por nombre y apellido podría ser más compleja.
          // Por ahora, buscaremos que el primer término coincida con el inicio del nombre
          // y si hay un segundo término, que coincida con el inicio del apellido.
          // Esto requeriría índices compuestos si se combinan múltiples 'orderBy' o 'where' de desigualdad.
          // Ejemplo simple: buscar que el nombre comience con el primer término.
          query = query.where('name', '>=', searchTerms[0]).where('name', '<=', searchTerms[0] + '\uf8ff');
          // Si quisiéramos buscar también por apellido con el segundo término:
          // if (searchTerms.length > 1) {
          //   query = query.where('lastName', '>=', searchTerms[1]).where('lastName', '<=', searchTerms[1] + '\uf8ff');
          // }
          // Nota: Firestore tiene limitaciones en consultas con múltiples campos de desigualdad.
          // Una solución más robusta sería un campo 'searchableName' o un servicio de búsqueda.
        }
      }
    }

    // Aplicar ordenación después de los filtros de 'where'
    if (filters?.search) {
        // Si hay búsqueda, puede que queramos ordenar por relevancia o mantener el orden actual
        // Por ahora, mantendremos la ordenación por defecto si hay búsqueda.
        // Si no, ordenamos por apellido y nombre.
    } else {
        query = query.orderBy('lastName', 'asc').orderBy('name', 'asc');
    }
    // O por fecha de creación como estaba antes:
    // query = query.orderBy('createdAt', 'desc');


    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        branchId: data.branchId,
        name: data.name,
        lastName: data.lastName,
        dni: data.dni,
        phone: data.phone,
        phone2: data.phone2,
        email: data.email,
        address: data.address,
        businessName: data.businessName,
        cuit: data.cuit,
        fiscalCondition: data.fiscalCondition,
        notes: data.notes,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Client;
    });

  } catch (error) {
    console.error("Error al obtener clientes:", error);
    // En caso de error en la consulta (ej. índice faltante), devolver array vacío para no romper la UI.
    // El error se loguea en el servidor.
    return [];
  }
}
