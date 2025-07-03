// src/lib/actions/order.actions.ts
"use server";

import type { Order, AuditLogEntry, Comment as OrderCommentType, OrderStatus, OrderPartItem, PaymentItem, UserRole, MessageTemplateKey, Branch, User, OrderFormData } from "@/types";
import { OrderSchema } from "@/lib/schemas";
import { getClientById } from "./client.actions";
import { DEFAULT_STORE_SETTINGS } from "../constants";
import { updatePartStock, getPartById } from "./part.actions";
import { getUsersByRole, getUserById } from './user.actions';
import { createNotification } from './notification.actions';
import { PackageCheck, PackageSearch, Briefcase, MessageCircle } from 'lucide-react';
import { getBranchById } from "./branch.actions";
import { getWhatsAppMessage } from "./communication.actions";

import { adminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore'; // Asegurar que FieldValue esté importado

type OrderFirestoreData = Omit<Order, 'id' | 'auditLog' | 'commentsHistory' | 'paymentHistory' | 'entryDate' | 'createdAt' | 'updatedAt' | 'readyForPickupDate' | 'deliveryDate'> &
{
  entryDate: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  readyForPickupDate?: FirebaseFirestore.Timestamp | null;
  deliveryDate?: FirebaseFirestore.Timestamp | null;
};

async function addAuditLogToOrderDB(
  orderRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
  userName: string,
  description: string,
  transaction?: FirebaseFirestore.Transaction
): Promise<void> {
  const auditLogRef = orderRef.collection('auditLog').doc();
  const auditEntry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp: FirebaseFirestore.Timestamp } = {
    userId: userName,
    userName,
    description,
    timestamp: Timestamp.now(),
  };
  if (transaction) {
    transaction.set(auditLogRef, auditEntry);
  } else {
    await auditLogRef.set(auditEntry);
  }
}

export async function createOrder(
  values: OrderFormData,
  userName: string,
  branchIdFromUserContext: string,
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation Errors for createOrder:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Campos inválidos. Por favor revise el formulario." };
  }
  
  const data = validatedFields.data;

  if (data.branchId !== branchIdFromUserContext) {
      return { success: false, message: "Error de permisos: La sucursal de la orden no coincide con la del usuario." };
  }

  const client = await getClientById(data.clientId);
  if (!client) {
      return { success: false, message: "El cliente seleccionado no es válido o no fue encontrado." };
  }

  const orderNumber = `ORD-${Date.now()}`;
  const now = Timestamp.now();
  const orderRef = adminDb.collection('orders').doc();

  try {
    await adminDb.runTransaction(async (transaction) => {
      if (data.partsUsed && data.partsUsed.length > 0) {
        for (const partUsed of data.partsUsed) {
          const partRefDb = adminDb.collection('parts').doc(partUsed.partId);
          const partDoc = await transaction.get(partRefDb);
          if (!partDoc.exists) {
            throw new Error(`Repuesto con ID ${partUsed.partId} (${partUsed.partName}) no encontrado.`);
          }
          const currentStock = partDoc.data()?.stock || 0;
          if (currentStock < partUsed.quantity) {
            throw new Error(`Stock insuficiente para ${partUsed.partName}. Stock actual: ${currentStock}, se necesitan ${partUsed.quantity}.`);
          }
          transaction.update(partRefDb, {
            stock: currentStock - partUsed.quantity,
            updatedAt: now,
          });
        }
      }

      const newOrderData: OrderFirestoreData = {
        branchId: data.branchId,
        clientId: data.clientId,
        clientName: client.name,
        clientLastName: client.lastName,
        clientPhone: client.phone,
        assignedTechnicianId: data.assignedTechnicianId || null,
        assignedTechnicianName: data.assignedTechnicianName || null,
        deviceBrand: data.deviceBrand,
        deviceModel: data.deviceModel,
        deviceColor: data.deviceColor || null,
        deviceIMEI: data.deviceIMEI || null,
        imeiNotVisible: data.imeiNotVisible,
        accessories: data.accessories || null,
        declaredFault: data.declaredFault,
        unlockPatternProvided: data.unlockPatternProvided,
        checklist: data.checklist,
        damageRisk: data.damageRisk || null,
        costSparePart: data.costSparePart,
        costLabor: data.costLabor,
        observations: data.observations || null,
        partsUsed: data.partsUsed || [],
        estimatedCompletionTime: data.estimatedCompletionTime || null,
        status: "Recibido",
        classification: data.classification || null,
        intakeFormSigned: false,
        pickupFormSigned: false,
        orderNumber: orderNumber,
        entryDate: now,
        createdAt: now,
        updatedAt: now,
        readyForPickupDate: null,
        deliveryDate: null,
      };
      transaction.set(orderRef, newOrderData);
      await addAuditLogToOrderDB(orderRef, userName, 'Orden creada en el sistema.', transaction);
      if (data.partsUsed && data.partsUsed.length > 0) {
        await addAuditLogToOrderDB(orderRef, userName, `${data.partsUsed.length} repuesto(s) asignado(s) y descontado(s) del stock.`, transaction);
      }
    });

    const createdOrderDoc = await orderRef.get();
    const orderToReturn = mapFirestoreDocToOrder(createdOrderDoc);
    if (!orderToReturn) {
        throw new Error("No se pudo mapear la orden creada.");
    }

    return { success: true, message: `Orden ${orderNumber} creada exitosamente.`, order: orderToReturn };

  } catch (error: any) {
    console.error("Error al crear la orden:", error);
    return { success: false, message: error.message || "Ocurrió un error al crear la orden." };
  }
}

function mapFirestoreDocToOrder(doc: FirebaseFirestore.DocumentSnapshot): Order | null {
    if (!doc.exists) return null;
    const data = doc.data() as any;

    const partsUsed = data.partsUsed ? data.partsUsed.map((p: OrderPartItem) => ({...p})) : [];
    const checklist = data.checklist ? {...data.checklist} : {};

    return {
        id: doc.id,
        orderNumber: data.orderNumber,
        branchId: data.branchId,
        clientId: data.clientId,
        clientName: data.clientName,
        clientLastName: data.clientLastName,
        clientPhone: data.clientPhone,
        deviceBrand: data.deviceBrand,
        deviceModel: data.deviceModel,
        deviceColor: data.deviceColor,
        accessories: data.accessories,
        deviceIMEI: data.deviceIMEI,
        imeiNotVisible: data.imeiNotVisible,
        declaredFault: data.declaredFault,
        unlockPatternProvided: data.unlockPatternProvided,
        checklist: checklist,
        damageRisk: data.damageRisk,
        costSparePart: data.costSparePart,
        costLabor: data.costLabor,
        observations: data.observations,
        status: data.status,
        classification: data.classification,
        entryDate: data.entryDate instanceof Timestamp ? data.entryDate.toDate().toISOString() : data.entryDate,
        estimatedCompletionTime: data.estimatedCompletionTime,
        readyForPickupDate: data.readyForPickupDate instanceof Timestamp ? data.readyForPickupDate.toDate().toISOString() : (data.readyForPickupDate === null ? undefined : data.readyForPickupDate),
        deliveryDate: data.deliveryDate instanceof Timestamp ? data.deliveryDate.toDate().toISOString() : (data.deliveryDate === null ? undefined : data.deliveryDate),
        commentsHistory: [],
        auditLog: [],
        intakeFormSigned: data.intakeFormSigned,
        pickupFormSigned: data.pickupFormSigned,
        assignedTechnicianId: data.assignedTechnicianId,
        assignedTechnicianName: data.assignedTechnicianName,
        partsUsed: partsUsed,
        paymentHistory: data.paymentHistory || [],
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!id) {
    console.log("getOrderById: orderId is undefined or empty.");
    return null;
  }
  try {
    const orderRef = adminDb.collection('orders').doc(id);
    const docSnap = await orderRef.get();
    return mapFirestoreDocToOrder(docSnap);
  } catch (error) {
    console.error(`Error al obtener orden por ID ${id}:`, error);
    return null;
  }
}

export async function getOrders(filters?: {
  branchId?: string;
  client?: string;
  orderNumber?: string;
  imei?: string;
  status?: string;
  limitCount?: number;
  startAfterDocId?: string;
}): Promise<Order[]> {
  try {
    let query: admin.firestore.Query = adminDb.collection('orders');

    if (filters?.branchId) {
      query = query.where('branchId', '==', filters.branchId);
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.orderNumber) {
      query = query.where('orderNumber', '>=', filters.orderNumber)
                   .where('orderNumber', '<=', filters.orderNumber + '\uf8ff');
    }

    if (filters?.imei) {
      query = query.where('deviceIMEI', '==', filters.imei);
    }

    if (filters?.client) {
      const clientSearch = filters.client;
      query = query.where('clientName', '>=', clientSearch)
                   .where('clientName', '<=', clientSearch + '\uf8ff');
    }

    query = query.orderBy('entryDate', 'desc');

    if (filters?.startAfterDocId) {
      const startAfterDoc = await adminDb.collection('orders').doc(filters.startAfterDocId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    query = query.limit(filters?.limitCount || 10);

    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => mapFirestoreDocToOrder(doc)).filter(Boolean) as Order[];
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return [];
  }
}

export async function updateOrder(
  orderId: string,
  values: OrderFormData,
  userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Validation Errors for updateOrder:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos inválidos para actualizar la orden." };
  }

  const data = validatedFields.data;
  const orderRef = adminDb.collection('orders').doc(orderId);
  const now = Timestamp.now();

  try {
    await adminDb.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error("Orden no encontrada.");
      }
      const originalOrderData = orderDoc.data() as OrderFirestoreData;

      let clientName = originalOrderData.clientName;
      let clientLastName = originalOrderData.clientLastName;
      let clientPhone = originalOrderData.clientPhone;
      let auditLogDescription = "Orden actualizada.";

      if (data.clientId && data.clientId !== originalOrderData.clientId) {
        const client = await getClientById(data.clientId);
        if (!client) {
          throw new Error("El nuevo cliente seleccionado no es válido o no fue encontrado.");
        }
        clientName = client.name;
        clientLastName = client.lastName;
        clientPhone = client.phone;
        await addAuditLogToOrderDB(orderRef, userName, `Cliente cambiado de ${originalOrderData.clientName} ${originalOrderData.clientLastName} a ${clientName} ${clientLastName}.`, transaction);
        auditLogDescription += " Cliente actualizado.";
      }

      const originalParts = originalOrderData.partsUsed || [];
      const newParts = data.partsUsed || [];
      const stockAdjustments = new Map<string, { change: number, name: string }>();

      originalParts.forEach(p => {
        stockAdjustments.set(p.partId, {
          change: (stockAdjustments.get(p.partId)?.change || 0) + p.quantity,
          name: p.partName
        });
      });

      newParts.forEach(p => {
        stockAdjustments.set(p.partId, {
          change: (stockAdjustments.get(p.partId)?.change || 0) - p.quantity,
          name: p.partName
        });
      });

      let partsChangedDescription = "";
      for (const [partId, { change, name }] of stockAdjustments.entries()) {
        if (change !== 0) {
          const partRefDb = adminDb.collection('parts').doc(partId);
          const partDoc = await transaction.get(partRefDb);
          if (!partDoc.exists) {
            throw new Error(`Repuesto con ID ${partId} (${name}) no encontrado durante la actualización de la orden.`);
          }
          const currentStock = partDoc.data()?.stock || 0;
          const newStock = currentStock + change;

          if (newStock < 0) {
            throw new Error(`Stock insuficiente para ${name}. Stock actual: ${currentStock}, se necesitan ${Math.abs(change)}.`);
          }
          transaction.update(partRefDb, { stock: newStock, updatedAt: now });
          partsChangedDescription += ` Repuesto ${name} (${change > 0 ? '+' : ''}${change} unidades).`;
        }
      }
      if (partsChangedDescription) {
        await addAuditLogToOrderDB(orderRef, userName, `Ajuste de repuestos:${partsChangedDescription}`, transaction);
        auditLogDescription += " Repuestos actualizados.";
      }

      const updatedOrderFields: Partial<OrderFirestoreData> = {
        ...data,
        clientName,
        clientLastName,
        clientPhone,
        updatedAt: now,
        assignedTechnicianId: data.assignedTechnicianId || null,
        assignedTechnicianName: data.assignedTechnicianName || null,
        deviceColor: data.deviceColor || null,
        deviceIMEI: data.deviceIMEI || null,
        accessories: data.accessories || null,
        damageRisk: data.damageRisk || null,
        observations: data.observations || null,
        estimatedCompletionTime: data.estimatedCompletionTime || null,
        classification: data.classification || null,
      };

      transaction.update(orderRef, updatedOrderFields);
      await addAuditLogToOrderDB(orderRef, userName, auditLogDescription, transaction);
    });

    const updatedDoc = await orderRef.get();
    const orderToReturn = mapFirestoreDocToOrder(updatedDoc);
     if (!orderToReturn) {
        throw new Error("No se pudo mapear la orden actualizada.");
    }

    return { success: true, message: "Orden actualizada exitosamente.", order: orderToReturn };

  } catch (error: any) {
    console.error(`Error al actualizar la orden ${orderId}:`, error);
    return { success: false, message: error.message || "Ocurrió un error al actualizar la orden." };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!orderId) {
    return { success: false, message: "ID de orden no proporcionado." };
  }
  const orderRef = adminDb.collection('orders').doc(orderId);
  const now = Timestamp.now();
  let auditDescription = "";

  try {
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Orden no encontrada." };
    }
    const orderData = orderDoc.data();
    const oldStatus = orderData?.status;
    auditDescription = `Estado cambiado de "${oldStatus}" a "${status}".`;

    const updateData: { status: OrderStatus; updatedAt: FirebaseFirestore.Timestamp; readyForPickupDate?: FirebaseFirestore.Timestamp | null; deliveryDate?: FirebaseFirestore.Timestamp | null } = {
      status: status,
      updatedAt: now,
    };

    if (status === "Listo para Entrega") {
      updateData.readyForPickupDate = now;
      auditDescription += " Marcada como lista para entrega.";
      if (orderData) await notifyRole('recepcionista', `Orden ${orderData.orderNumber} (${orderData.deviceModel}) lista para entregar.`, `/orders/${orderId}`, PackageCheck);
    } else if (status === "Entregado") {
      updateData.deliveryDate = now;
      auditDescription += " Marcada como entregada.";
    } else if (status === "En Espera de Repuestos") {
      if (orderData) await notifyRole('admin', `Orden ${orderData.orderNumber} (${orderData.deviceModel}) necesita repuestos.`, `/orders/${orderId}`, PackageSearch);
    }

    await orderRef.update(updateData);
    await addAuditLogToOrderDB(orderRef, userName, auditDescription);
    
    const updatedOrderDoc = await orderRef.get();
    const orderToReturn = mapFirestoreDocToOrder(updatedOrderDoc);

    return { success: true, message: "Estado de la orden actualizado.", order: orderToReturn ?? undefined };
  } catch (error: any) {
    console.error(`Error al actualizar estado de la orden ${orderId}:`, error);
    return { success: false, message: error.message || "Error al actualizar estado." };
  }
}

export async function addOrderComment(
  orderId: string,
  commentText: string,
  userName: string
): Promise<{ success: boolean; message: string; comment?: OrderCommentType; order?: Order }> {
  if (!orderId) {
    return { success: false, message: "ID de orden no proporcionado." };
  }
  if (!commentText.trim()) {
    return { success: false, message: "El comentario no puede estar vacío." };
  }

  const orderRef = adminDb.collection('orders').doc(orderId);
  const commentRef = orderRef.collection('commentsHistory').doc();
  const now = Timestamp.now();

  try {
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Orden no encontrada." };
    }

    const newCommentData: Omit<OrderCommentType, 'id' | 'timestamp'> & { timestamp: FirebaseFirestore.Timestamp } = {
      description: commentText.trim(),
      userId: userName,
      userName: userName,
      timestamp: now,
    };

    await commentRef.set(newCommentData);
    await orderRef.update({ updatedAt: now });
    await addAuditLogToOrderDB(orderRef, userName, `Comentario agregado: "${commentText.substring(0, 50)}..."`);

    const updatedOrderDoc = await orderRef.get();
    const orderToReturn = mapFirestoreDocToOrder(updatedOrderDoc);

    const createdComment : OrderCommentType = {
        id: commentRef.id,
        ...newCommentData,
        timestamp: newCommentData.timestamp.toDate().toISOString(),
    };

    return { success: true, message: "Comentario agregado.", comment: createdComment, order: orderToReturn ?? undefined };
  } catch (error: any) {
    console.error(`Error al agregar comentario a la orden ${orderId}:`, error);
    return { success: false, message: error.message || "Error al agregar comentario." };
  }
}

export async function updateOrderConfirmations(
  orderId: string,
  confirmationType: 'intake' | 'pickup',
  isChecked: boolean,
  userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!orderId) {
    return { success: false, message: "ID de orden no proporcionado." };
  }
  const orderRef = adminDb.collection('orders').doc(orderId);
  const now = Timestamp.now();

  const fieldToUpdate = confirmationType === 'intake' ? 'intakeFormSigned' : 'pickupFormSigned';
  const formName = confirmationType === 'intake' ? 'Ingreso' : 'Retiro';
  const actionText = isChecked ? 'marcó como firmado' : 'desmarcó como no firmado';
  const auditDescription = `Usuario ${actionText} el comprobante de ${formName}.`;

  try {
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Orden no encontrada." };
    }

    await orderRef.update({
      [fieldToUpdate]: isChecked,
      updatedAt: now,
    });

    await addAuditLogToOrderDB(orderRef, userName, auditDescription);

    const updatedOrderDoc = await orderRef.get();
    const orderToReturn = mapFirestoreDocToOrder(updatedOrderDoc);

    return { success: true, message: "Confirmación actualizada.", order: orderToReturn ?? undefined };
  } catch (error: any) {
    console.error(`Error al actualizar confirmación para orden ${orderId}:`, error);
    return { success: false, message: error.message || "Error al actualizar confirmación." };
  }
}

export async function updateOrderImei(
    orderId: string,
    imei: string,
    userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!orderId) {
    return { success: false, message: "ID de orden no proporcionado." };
  }
  if (!imei || imei.trim() === "") {
    return { success: false, message: "IMEI/Serie no puede estar vacío."};
  }

  const orderRef = adminDb.collection('orders').doc(orderId);
  const now = Timestamp.now();

  try {
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Orden no encontrada." };
    }
    const oldImei = orderDoc.data()?.deviceIMEI || "N/A";
    const auditDescription = `IMEI/Serie actualizado de "${oldImei}" a "${imei}".`;

    await orderRef.update({
      deviceIMEI: imei.trim(),
      imeiNotVisible: false,
      updatedAt: now,
    });

    await addAuditLogToOrderDB(orderRef, userName, auditDescription);

    const updatedOrderDoc = await orderRef.get();
    const orderToReturn = mapFirestoreDocToOrder(updatedOrderDoc);

    return { success: true, message: "IMEI/Serie actualizado.", order: orderToReturn ?? undefined };
  } catch (error: any) {
    console.error(`Error al actualizar IMEI para orden ${orderId}:`, error);
    return { success: false, message: error.message || "Error al actualizar IMEI/Serie." };
  }
}

export async function logIntakeDocumentPrint(
  orderId: string,
  userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!orderId) return { success: false, message: "ID de orden no proporcionado." };
  const orderRef = adminDb.collection('orders').doc(orderId);
  try {
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Orden no encontrada." };
    }
    await addAuditLogToOrderDB(orderRef, userName, "Documentos de ingreso (Interno y Cliente) impresos.");
    await orderRef.update({ updatedAt: Timestamp.now() });

    const updatedDoc = await orderRef.get();
    return { success: true, message: "Acción registrada en bitácora.", order: mapFirestoreDocToOrder(updatedDoc) ?? undefined };
  } catch (error: any) {
    console.error(`Error en logIntakeDocumentPrint para orden ${orderId}:`, error);
    return { success: false, message: error.message || "Error al registrar impresión."};
  }
}

export async function logWhatsAppAttempt(
  orderId: string,
  userName: string,
  message: string,
): Promise<{ success: boolean, message: string, order?: Order }> {
   if (!orderId) return { success: false, message: "ID de orden no proporcionado." };
  const orderRef = adminDb.collection('orders').doc(orderId);
  try {
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Orden no encontrada." };
    }
    await addAuditLogToOrderDB(orderRef, userName, `Intento de envío de WhatsApp: "${message.substring(0,150)}..."`);
    await orderRef.update({ updatedAt: Timestamp.now() });

    const updatedDoc = await orderRef.get();
    return { success: true, message: "Intento de envío registrado.", order: mapFirestoreDocToOrder(updatedDoc) ?? undefined };
  } catch (error: any) {
    console.error(`Error en logWhatsAppAttempt para orden ${orderId}:`, error);
    return { success: false, message: error.message || "Error al registrar intento de WhatsApp."};
  }
}

async function notifyRole(role: UserRole, message: string, link: string, icon?: any): Promise<void> {
    try {
        const usersToNotify = await getUsersByRole(role);
        if (usersToNotify && usersToNotify.length > 0) {
            for (const user of usersToNotify) {
                if (user.status === 'active') {
                    await createNotification({
                        userId: user.uid,
                        message,
                        link,
                        icon: icon
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error en notifyRole para rol ${role}:`, error);
    }
}

export async function assignTechnicianToOrder(
  orderId: string,
  technicianId: string,
  assignerName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!orderId || !technicianId) {
    return { success: false, message: "ID de orden o técnico no proporcionado."};
  }
  const orderRef = adminDb.collection('orders').doc(orderId);
  const now = Timestamp.now();

  try {
    const technician = await getUserById(technicianId);
    if (!technician) {
        throw new Error("Técnico no encontrado.");
    }
    if (technician.role !== 'tecnico') {
        throw new Error("El usuario seleccionado no es un técnico.");
    }
    if (technician.status !== 'active') {
        throw new Error("El técnico seleccionado no está activo.");
    }
    const technicianName = technician.name;

    const orderDoc = await orderRef.get();
    if(!orderDoc.exists) {
        throw new Error("Orden no encontrada.");
    }
    const orderData = orderDoc.data();
    const oldTechnicianName = orderData?.assignedTechnicianName || "Nadie";

    await orderRef.update({
      assignedTechnicianId: technicianId,
      assignedTechnicianName: technicianName,
      updatedAt: now,
    });

    await addAuditLogToOrderDB(orderRef, assignerName, `Técnico reasignado de "${oldTechnicianName}" a "${technicianName}".`);

    if (orderData) {
        await createNotification({
            userId: technicianId,
            message: `Te han asignado la orden ${orderData.orderNumber} (${orderData.deviceModel}).`,
            link: `/orders/${orderId}`,
            icon: Briefcase
        });
    }

    const updatedOrderDoc = await orderRef.get();
    return { success: true, message: "Técnico asignado exitosamente.", order: mapFirestoreDocToOrder(updatedOrderDoc) ?? undefined };

  } catch (error: any) {
    console.error(`Error al asignar técnico a la orden ${orderId}:`, error);
    return { success: false, message: error.message || "Error al asignar técnico." };
  }
}


export async function generateWhatsAppLink(
  orderId: string,
  templateKey: MessageTemplateKey,
  userNamePerformingAction: string,
  userIdPerformingAction: string
): Promise<{ success: boolean, message?: string, url?: string, order?: Order }> {

    const order = await getOrderById(orderId);
    if (!order) return { success: false, message: "Orden no encontrada." };

    const userActing = await getUserById(userIdPerformingAction);
    if (!userActing) return {success: false, message: "Usuario que realiza la acción no encontrado."};

    const branch = await getBranchById(order.branchId);
    if (!branch) return { success: false, message: `Sucursal con ID ${order.branchId} no encontrada.`};

    const messageText = await getWhatsAppMessage(templateKey, order, branch, userActing);

    await logWhatsAppAttempt(orderId, userNamePerformingAction, messageText);
    
    const cleanedPhone = (order.clientPhone || '').replace(/[\s+()-]/g, '');
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(messageText)}`;
    
    const currentOrderState = await getOrderById(orderId);
    return { success: true, url: whatsappUrl, order: currentOrderState ?? undefined };
}


export async function addPartToOrder(orderId: string, part: OrderPartItem): Promise<{ success: boolean; message: string }> {
    console.warn(`addPartToOrder (${orderId}) es probablemente redundante. La lógica de partes está en updateOrder/createOrder.`);
    return { success: true, message: "Función no implementada (ver updateOrder)." };
}

export async function recordPaymentForOrder(orderId: string, payment: PaymentItem, userName: string = "Sistema"): Promise<{ success: boolean; message: string; order?: Order }> {
    if (!orderId) return { success: false, message: "ID de orden no proporcionado."};

    const orderRef = adminDb.collection('orders').doc(orderId);
    const now = Timestamp.now();
    try {
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return { success: false, message: "Orden no encontrada." };
        }

        const paymentWithTimestamp = {
            ...payment,
            date: payment.date instanceof Date ? Timestamp.fromDate(payment.date) : (typeof payment.date === 'string' ? Timestamp.fromDate(new Date(payment.date)) : Timestamp.now())
        };
        await orderRef.update({
            paymentHistory: FieldValue.arrayUnion(paymentWithTimestamp),
            updatedAt: now,
        });
        await addAuditLogToOrderDB(orderRef, userName, `Pago registrado: ${payment.method} $${payment.amount.toFixed(2)}`);

        const updatedOrderDoc = await orderRef.get();
        return { success: true, message: "Pago registrado.", order: mapFirestoreDocToOrder(updatedOrderDoc) ?? undefined };
    } catch (error: any) {
        console.error(`Error al registrar pago para orden ${orderId}:`, error);
        return { success: false, message: error.message || "Error al registrar pago." };
    }
}
