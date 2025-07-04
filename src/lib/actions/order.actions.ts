// src/lib/actions/order.actions.ts
"use server";

import type { Order, AuditLogEntry, Comment as OrderCommentType, OrderStatus, OrderPartItem, PaymentItem, UserRole, MessageTemplateKey, Branch, User } from "@/types";
import { OrderSchema } from "@/lib/schemas";
import type { z } from "zod";
import { getClientById } from "./client.actions";
import { DEFAULT_STORE_SETTINGS } from "../constants";
import { updatePartStock } from "./part.actions";
import { getUsersByRole, getUserById, getUsers } from './user.actions';
import { createNotification } from './notification.actions';
import { PackageCheck, PackageSearch, Briefcase, MessageCircle } from 'lucide-react';
import { getBranchById } from "./branch.actions";
import { getWhatsAppMessage } from "./communication.actions";

let mockOrders: Order[] = [];
let orderCounter = mockOrders.length;

function generateOrderNumber(): string {
  orderCounter += 1;
  return `ORD${String(orderCounter).padStart(3, '0')}`;
}

// --- Funciones para Backup y Restauración ---
export async function getRawOrderData() {
  return {
    orders: mockOrders,
    counter: orderCounter,
  };
}

export async function restoreOrderData(data: { orders: Order[]; counter: number }) {
  mockOrders = data.orders || [];
  orderCounter = data.counter || (data.orders?.length ?? 0);
}
// --- Fin Funciones para Backup y Restauración ---


function createAuditLogEntry(userName: string, description: string): Omit<AuditLogEntry, 'id' | 'userId'> {
    return {
        userName,
        description,
        timestamp: new Date().toISOString(),
    };
}

function addAuditLog(order: Order, userName: string, description: string) {
    const newLogEntry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        userId: userName, // Using name for simplicity in mock
        userName,
        description,
        timestamp: new Date().toISOString(),
    };
    order.auditLog.push(newLogEntry);
}


export async function createOrder(
  values: z.infer<typeof OrderSchema>,
  userName: string,
  branchId: string, // Branch context is now required
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Campos inválidos. Por favor revise el formulario." };
  }
  
  const data = validatedFields.data;

  if (data.branchId !== branchId) {
      return { success: false, message: "Error de permisos: La sucursal no coincide." };
  }

  const client = await getClientById(data.clientId);
  if (!client) {
      return { success: false, message: "El cliente seleccionado no es válido." };
  }

  const newOrderNumber = generateOrderNumber();
  const newOrder: Order = {
    id: newOrderNumber,
    orderNumber: newOrderNumber,
    ...data,
    clientName: client.name,
    clientLastName: client.lastName,
    clientPhone: client.phone,
    branchId: branchId,
    entryDate: new Date().toISOString(),
    status: "Recibido",
    intakeFormSigned: false,
    pickupFormSigned: false,
    auditLog: [],
    commentsHistory: [],
  };

  addAuditLog(newOrder, userName, 'Orden creada en el sistema.');

  if (data.partsUsed && data.partsUsed.length > 0) {
    for (const part of data.partsUsed) {
      const stockResult = await updatePartStock(part.partId, -part.quantity);
      if (!stockResult.success) {
        return { success: false, message: stockResult.message || "Error de stock." };
      }
    }
    addAuditLog(newOrder, userName, `${data.partsUsed.length} repuesto(s) asignado(s) y descontado(s) del stock.`);
  }

  mockOrders.push(newOrder);
  return { success: true, message: `Orden ${newOrderNumber} creada exitosamente.`, order: newOrder };
}

export async function getOrders(filters?: { client?: string, orderNumber?: string, imei?: string, status?: string }): Promise<Order[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredOrders = mockOrders;

  if (filters) {
    if (filters.client) {
      const clientLower = filters.client.toLowerCase();
      filteredOrders = filteredOrders.filter(o => 
          (o.clientName?.toLowerCase().includes(clientLower)) ||
          (o.clientLastName?.toLowerCase().includes(clientLower)) ||
          (o.clientId?.toLowerCase().includes(clientLower))
      );
    }
    if (filters.orderNumber) {
      filteredOrders = filteredOrders.filter(o => o.orderNumber.toLowerCase().includes(filters.orderNumber!.toLowerCase()));
    }
    if (filters.imei) {
      filteredOrders = filteredOrders.filter(o => o.deviceIMEI && o.deviceIMEI.includes(filters.imei!));
    }
    if (filters.status) {
      filteredOrders = filteredOrders.filter(o => o.status === filters.status);
    }
  }

  return filteredOrders.sort((a, b) => new Date(b.entryDate as string).getTime() - new Date(a.entryDate as string).getTime());
}

export async function getOrderById(id: string): Promise<Order | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const order = mockOrders.find(o => o.id === id);
  if (!order) return null;

  const client = await getClientById(order.clientId);
  return {
    ...order,
    clientName: client?.name || 'N/D',
    clientLastName: client?.lastName || '',
    clientPhone: client?.phone || '',
  };
}


export async function updateOrder(
  orderId: string,
  values: z.infer<typeof OrderSchema>,
  userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.safeParse(values);
  if (!validatedFields.success) {
    console.log("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos inválidos para actualizar." };
  }

  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }
  
  const originalOrder = mockOrders[orderIndex];
  const data = validatedFields.data;
  
  let clientName = originalOrder.clientName;
  let clientLastName = originalOrder.clientLastName;
  let clientPhone = originalOrder.clientPhone;


  if (data.clientId && data.clientId !== originalOrder.clientId) {
    const client = await getClientById(data.clientId);
    if (!client) {
        return { success: false, message: "El nuevo cliente seleccionado no es válido." };
    }
    clientName = client.name;
    clientLastName = client.lastName;
    clientPhone = client.phone;
    addAuditLog(originalOrder, userName, `Cliente cambiado a: ${client.name} ${client.lastName}.`);
  }
  
  const originalParts = originalOrder.partsUsed || [];
  const newParts = data.partsUsed || [];

  const stockAdjustments = new Map<string, number>();

  originalParts.forEach(part => {
      stockAdjustments.set(part.partId, (stockAdjustments.get(part.partId) || 0) + part.quantity);
  });

  newParts.forEach(part => {
      stockAdjustments.set(part.partId, (stockAdjustments.get(part.partId) || 0) - part.quantity);
  });

  for (const [partId, quantityDelta] of stockAdjustments.entries()) {
    if (quantityDelta !== 0) {
        const stockResult = await updatePartStock(partId, -quantityDelta);
        if (!stockResult.success) {
            return { success: false, message: `Error de stock al actualizar: ${stockResult.message}` };
        }
    }
  }

  mockOrders[orderIndex] = {
    ...originalOrder,
    ...data,
    clientName,
    clientLastName,
    clientPhone,
  };
  
  addAuditLog(mockOrders[orderIndex], userName, 'Datos de la orden y repuestos actualizados.');

  return { success: true, message: "Orden actualizada.", order: mockOrders[orderIndex] };
}

// Helper to notify all users of a certain role
async function notifyRole(role: UserRole, message: string, link: string, icon: any) {
    const usersToNotify = await getUsersByRole(role);
    for (const user of usersToNotify) {
        await createNotification({ userId: user.uid, message, link, icon });
    }
}


export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }

  const order = mockOrders[orderIndex];
  const oldStatus = order.status;
  order.status = status;
  addAuditLog(order, userName, `Estado cambiado de "${oldStatus}" a "${status}".`);

  // --- Notification Logic ---
  const notificationLink = `/orders/${order.id}`;
  
  switch(status) {
    case "Listo para Entrega":
      order.readyForPickupDate = new Date().toISOString();
      await notifyRole(
        'recepcionista', 
        `Orden ${order.orderNumber} (${order.deviceModel}) lista para entregar.`, 
        notificationLink,
        PackageCheck
      );
      break;
    
    case "Entregado":
      order.deliveryDate = new Date().toISOString();
      break;

    case "En Espera de Repuestos":
      await notifyRole(
        'admin', 
        `Orden ${order.orderNumber} (${order.deviceModel}) necesita repuestos.`, 
        notificationLink,
        PackageSearch
      );
      break;
  }
  // --- End Notification Logic ---

  return { success: true, message: "Estado de la orden actualizado.", order: order };
}

export async function updateOrderConfirmations(
  orderId: string,
  confirmationType: 'intake' | 'pickup',
  isChecked: boolean,
  userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        return { success: false, message: "Orden no encontrada." };
    }

    const fieldToUpdate = confirmationType === 'intake' ? 'intakeFormSigned' : 'pickupFormSigned';
    const formName = confirmationType === 'intake' ? 'Ingreso' : 'Retiro';
    const actionText = isChecked ? 'marcó como firmado' : 'desmarcó como firmado';
    const logMessage = `Usuario ${actionText} el comprobante de ${formName}.`;
        
    const order = mockOrders[orderIndex];
    order[fieldToUpdate] = isChecked;
    addAuditLog(order, userName, logMessage);

    return { success: true, message: "Confirmación actualizada.", order: order };
}

export async function updateOrderImei(
    orderId: string,
    imei: string,
    userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        return { success: false, message: "Orden no encontrada." };
    }
    const order = mockOrders[orderIndex];
    const oldImei = order.deviceIMEI || "N/A";
    order.deviceIMEI = imei;
    order.imeiNotVisible = false; // It's visible now
    addAuditLog(order, userName, `IMEI/Serie actualizado de "${oldImei}" a "${imei}".`);
    return { success: true, message: "IMEI actualizado.", order: order };
}


export async function addOrderComment(
  orderId: string,
  commentText: string,
  userName: string
): Promise<{ success: boolean; message: string; comment?: OrderCommentType; order?: Order }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }
  const order = mockOrders[orderIndex];
  const commentId = `cmt-${Date.now()}`;
  const newComment: OrderCommentType = {
    id: commentId,
    description: commentText,
    timestamp: new Date().toISOString(),
    userId: userName, // Use name for simplicity in mock
    userName: userName,
  };

  order.commentsHistory.push(newComment);
  addAuditLog(order, userName, `Comentario agregado: "${commentText.substring(0, 30)}..."`);

  return { success: true, message: "Comentario agregado.", comment: newComment, order: order };
}

export async function addPartToOrder(orderId: string, part: OrderPartItem): Promise<{ success: boolean; message: string }> {
    console.log(`Simulating adding part ${part.partId} to order ${orderId}`);
    // In a real app, find the order and push the part to its partsUsed array.
    return { success: true, message: "Parte agregada (simulado)." };
}

export async function recordPaymentForOrder(orderId: string, payment: PaymentItem): Promise<{ success: boolean; message: string }> {
    console.log(`Simulating recording payment of ${payment.amount} for order ${orderId}`);
    // In a real app, find the order and push the payment to its paymentHistory array.
    return { success: true, message: "Pago registrado (simulado)." };
}

export async function logIntakeDocumentPrint(
  orderId: string,
  userName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }
  
  const order = mockOrders[orderIndex];
  const logDescription = `Documentos de ingreso (Interno y Cliente) impresos.`;
  addAuditLog(order, userName, logDescription);

  return { success: true, message: "Acción registrada en la bitácora.", order: order };
}

export async function logWhatsAppAttempt(
  orderId: string,
  userName: string,
  message: string,
): Promise<{ success: boolean, message: string, order?: Order }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada para registrar el envío de WhatsApp." };
  }
  const order = mockOrders[orderIndex];
  const logDescription = `Intento de envío de WhatsApp con mensaje: "${message.substring(0, 50)}..."`;
  addAuditLog(order, userName, logDescription);

  return { success: true, message: "Intento de envío registrado.", order: order };
}

export async function generateWhatsAppLink(
  orderId: string,
  templateKey: MessageTemplateKey,
  userName: string,
): Promise<{ success: boolean, message?: string, url?: string, order?: Order }> {
    const order = await getOrderById(orderId);
    const allUsers = await getUsers();
    const user = allUsers.find(u => u.name === userName);

    if (!order) return { success: false, message: "Orden no encontrada." };
    if (!user) return { success: false, message: "Usuario no encontrado." };

    const branch = await getBranchById(order.branchId);
    const message = await getWhatsAppMessage(templateKey, order, branch, user);

    const logResult = await logWhatsAppAttempt(orderId, userName, message);
    if (!logResult.success) {
      return { success: false, message: logResult.message };
    }
    
    const cleanedPhone = (order.clientPhone || '').replace(/[\s+()-]/g, '');
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    
    return { success: true, url: whatsappUrl, order: logResult.order };
}


export async function assignTechnicianToOrder(
  orderId: string,
  technicianId: string,
  assignerName: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }

  const technician = await getUserById(technicianId);
  if (!technician || technician.role !== 'tecnico') {
      return { success: false, message: "Técnico no válido." };
  }
  
  const order = mockOrders[orderIndex];
  const oldTechnicianName = order.assignedTechnicianName || "Nadie";

  order.assignedTechnicianId = technician.uid;
  order.assignedTechnicianName = technician.name;
  
  const logDescription = `Técnico reasignado de "${oldTechnicianName}" a "${technician.name}".`;
  addAuditLog(order, assignerName, logDescription);
  
  // Notify the assigned technician
  await createNotification({
    userId: technician.uid,
    message: `Te han asignado la orden ${order.orderNumber} (${order.deviceModel}).`,
    link: `/orders/${orderId}`,
    icon: Briefcase,
  });

  return { success: true, message: "Técnico asignado exitosamente.", order: order };
}
