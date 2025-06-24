// src/lib/actions/order.actions.ts
"use server";

import type { Order, AuditLogEntry, Comment as OrderCommentType, OrderStatus, OrderPartItem, PaymentItem } from "@/types";
import { OrderSchema } from "@/lib/schemas";
import type { z } from "zod";
import { suggestRepairSolutions } from "@/ai/flows/suggest-repair-solutions";
import { getMockClients, getClientById } from "./client.actions";
import { DEFAULT_STORE_SETTINGS } from "../constants";
import { updatePartStock } from "./part.actions";

let mockOrders: Order[] = [
  {
    id: "ORD001",
    orderNumber: "ORD001",
    branchId: "B001", // Belongs to Taller Central
    clientId: "1001",
    clientName: "Juan",
    clientLastName: "Perez",
    deviceBrand: "Samsung",
    deviceModel: "Galaxy S21",
    deviceColor: "Phantom Black",
    accessories: "Cargador original y cable",
    deviceIMEI: "123456789012345",
    imeiNotVisible: false,
    declaredFault: "Pantalla rota, no enciende después de caída.",
    unlockPatternProvided: true,
    checklist: {
      enciende: 'no',
      imagen_pantalla: 'no',
      respuesta_tactil: 'no',
      cristal_roto: 'si'
    },
    damageRisk: "Cristal trizado en esquina superior derecha. Marco con rayones visibles.",
    costSparePart: 150.00,
    costLabor: 50.00,
    observations: "Cliente indica que se cayó de una altura considerable. Posible daño en placa base además de la pantalla.",
    status: "En Diagnóstico",
    entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedCompletionTime: "18:00hs",
    intakeFormSigned: true,
    pickupFormSigned: false,
    auditLog: [
       { id: 'log-1', userId: 'tech123', userName: 'Tech User', description: 'Orden creada.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()},
       { id: 'log-2', userId: 'tech123', userName: 'Tech User', description: 'Confirmado: Comprobante de Ingreso firmado.', timestamp: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString()},
    ],
    commentsHistory: [
      { id: 'cmt-1', userId: 'tech123', userName: 'Tech User', description: 'Se confirma pantalla rota, posible daño en flex de display.', timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()}
    ],
    partsUsed: [
      { partId: "PART001", partName: "Pantalla iPhone 12 Original", quantity: 1, unitPrice: 150.00, costPrice: 80.00 }
    ],
    paymentHistory: [
      { id: "PAY001", amount: 100, method: 'efectivo', date: new Date().toISOString() },
      { id: "PAY002", amount: 100, method: 'tarjeta', date: new Date().toISOString() }
    ],
  },
  {
    id: "ORD002",
    orderNumber: "ORD002",
    branchId: "B002", // Belongs to Sucursal Norte
    clientId: "1002",
    clientName: "Maria",
    clientLastName: "Lopez",
    deviceBrand: "Apple",
    deviceModel: "iPhone 12",
    deviceColor: "Azul",
    accessories: "Sin accesorios",
    deviceIMEI: "987654321098765",
    imeiNotVisible: false,
    declaredFault: "No carga la batería",
    unlockPatternProvided: false,
    checklist: {
      enciende: 'no',
      imagen_pantalla: 'sc',
      respuesta_tactil: 'sc'
    },
    damageRisk: "",
    costSparePart: 80.00,
    costLabor: 40.00,
    observations: "Probable falla en pin de carga o batería.",
    status: "Listo para Entrega",
    readyForPickupDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    intakeFormSigned: false,
    pickupFormSigned: false,
    auditLog: [],
    commentsHistory: [],
    partsUsed: [],
  },
];
let orderCounter = mockOrders.length;

function generateOrderNumber(): string {
  orderCounter += 1;
  return `ORD${String(orderCounter).padStart(3, '0')}`;
}

function createAuditLogEntry(userId: string, userName: string, description: string): AuditLogEntry {
    return {
        id: `log-${Date.now()}`,
        userId,
        userName,
        description,
        timestamp: new Date().toISOString(),
    };
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
    branchId: branchId,
    entryDate: new Date().toISOString(),
    status: "Recibido",
    intakeFormSigned: false,
    pickupFormSigned: false,
    auditLog: [createAuditLogEntry(userName, userName, 'Orden creada en el sistema.')],
    commentsHistory: [],
  };

  if (data.partsUsed && data.partsUsed.length > 0) {
    for (const part of data.partsUsed) {
      const stockResult = await updatePartStock(part.partId, -part.quantity);
      if (!stockResult.success) {
        return { success: false, message: stockResult.message || "Error de stock." };
      }
    }
    newOrder.auditLog.push(createAuditLogEntry(userName, userName, `${data.partsUsed.length} repuesto(s) asignado(s) y descontado(s) del stock.`));
  }

  mockOrders.push(newOrder);
  return { success: true, message: `Orden ${newOrderNumber} creada exitosamente.`, order: newOrder };
}

export async function getOrders(filters?: { client?: string, orderNumber?: string, imei?: string, status?: string }): Promise<Order[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const clients = await getMockClients();

  let filteredOrders = mockOrders;

  if (filters) {
    if (filters.client) {
      const clientLower = filters.client.toLowerCase();
      const matchingClientIds = clients.filter(c => `${c.name} ${c.lastName}`.toLowerCase().includes(clientLower) || c.id.toLowerCase().includes(clientLower)).map(c => c.id);
      filteredOrders = filteredOrders.filter(o => matchingClientIds.includes(o.clientId));
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

  const ordersWithClientNames = filteredOrders.map(order => {
    const client = clients.find(c => c.id === order.clientId);
    return {
      ...order,
      clientName: client?.name || 'N/D',
      clientLastName: client?.lastName || '',
      clientPhone: client?.phone || '',
    };
  });

  return ordersWithClientNames.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
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

  if (data.clientId && data.clientId !== originalOrder.clientId) {
    const client = await getClientById(data.clientId);
    if (!client) {
        return { success: false, message: "El nuevo cliente seleccionado no es válido." };
    }
    clientName = client.name;
    clientLastName = client.lastName;
    originalOrder.auditLog.push(createAuditLogEntry(userName, userName, `Cliente cambiado a: ${client.name} ${client.lastName}.`));
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
    auditLog: [...originalOrder.auditLog, createAuditLogEntry(userName, userName, 'Datos de la orden y repuestos actualizados.')],
  };

  return { success: true, message: "Orden actualizada.", order: mockOrders[orderIndex] };
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

  mockOrders[orderIndex].status = status;
  if (status === "Listo para Entrega") {
    mockOrders[orderIndex].readyForPickupDate = new Date().toISOString();
  } else if (status === "Entregado") {
    mockOrders[orderIndex].deliveryDate = new Date().toISOString();
  }

  mockOrders[orderIndex].auditLog.push(createAuditLogEntry(userName, userName, `Estado cambiado a: ${status}.`));

  return { success: true, message: "Estado de la orden actualizado.", order: mockOrders[orderIndex] };
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
    const logMessage = confirmationType === 'intake' 
        ? `Confirmado: Comprobante de Ingreso ${isChecked ? 'firmado' : 'no firmado'}.`
        : `Confirmado: Comprobante de Retiro ${isChecked ? 'firmado' : 'no firmado'}.`;
        
    mockOrders[orderIndex][fieldToUpdate] = isChecked;
    mockOrders[orderIndex].auditLog.push(createAuditLogEntry(userName, userName, logMessage));

    return { success: true, message: "Confirmación actualizada.", order: mockOrders[orderIndex] };
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
    mockOrders[orderIndex].deviceIMEI = imei;
    mockOrders[orderIndex].imeiNotVisible = false; // It's visible now
    mockOrders[orderIndex].auditLog.push(createAuditLogEntry(userName, userName, `IMEI/Serie actualizado a: ${imei}.`));
    return { success: true, message: "IMEI actualizado.", order: mockOrders[orderIndex] };
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
  const commentId = `cmt-${Date.now()}`;
  const newComment: OrderCommentType = {
    id: commentId,
    description: commentText,
    timestamp: new Date().toISOString(),
    userId: userName, // Use name for simplicity in mock
    userName: userName,
  };

  mockOrders[orderIndex].commentsHistory.push(newComment);
  mockOrders[orderIndex].auditLog.push(createAuditLogEntry(userName, userName, `Comentario agregado: "${commentText.substring(0, 30)}..."`));

  return { success: true, message: "Comentario agregado.", comment: newComment, order: mockOrders[orderIndex] };
}


export async function getRepairSuggestions(
  deviceModel: string,
  faultDescription: string
): Promise<{ success: boolean; message?: string; suggestion?: any }> {
  try {
    const result = await suggestRepairSolutions({ deviceModel, faultDescription });
    return { success: true, suggestion: result };
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return { success: false, message: "Error al obtener sugerencias de la IA." };
  }
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
  
  const logDescription = `Documentos de ingreso (Interno y Cliente) impresos.`;
  mockOrders[orderIndex].auditLog.push(createAuditLogEntry(userName, userName, logDescription));

  return { success: true, message: "Acción registrada en la bitácora.", order: mockOrders[orderIndex] };
}
