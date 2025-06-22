// src/lib/actions/order.actions.ts
"use server";

import type { Order, User, Comment as OrderCommentType, OrderStatus } from "@/types";
import { OrderSchema } from "@/lib/schemas";
import type { z } from "zod";
import { suggestRepairSolutions } from "@/ai/flows/suggest-repair-solutions";
import { getMockClients } from "./client.actions";

let mockOrders: Order[] = [
  {
    id: "ORD001",
    orderNumber: "ORD001",
    clientId: "CLI001",
    deviceBrand: "Samsung",
    deviceModel: "Galaxy S21",
    deviceIMEI: "123456789012345",
    declaredFault: "Pantalla rota",
    checklist: {
      enciende: 'si',
      tactil: 'no',
      imagen: 'si',
      // ... other checklist items
    },
    damageRisk: "Cristal trizado en esquina superior.",
    costSparePart: 150.00,
    costLabor: 50.00,
    observations: "Cliente indica que se cayó.",
    status: "En Diagnóstico",
    entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    commentsHistory: [
      { id: 'cmt-1', userId: 'tech123', description: 'Se confirma pantalla rota, posible daño en flex de display.', timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()}
    ]
  },
  {
    id: "ORD002",
    orderNumber: "ORD002",
    clientId: "CLI002",
    deviceBrand: "Apple",
    deviceModel: "iPhone 12",
    deviceIMEI: "987654321098765",
    declaredFault: "No carga la batería",
    checklist: {
      enciende: 'no',
      // ... other checklist items
    },
    damageRisk: "",
    costSparePart: 80.00,
    costLabor: 40.00,
    observations: "Probable falla en pin de carga o batería.",
    status: "Listo para Entrega",
    readyForPickupDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    commentsHistory: []
  },
];
let orderCounter = mockOrders.length;

function generateOrderNumber(): string {
  orderCounter += 1;
  return `ORD${String(orderCounter).padStart(3, '0')}`;
}

export async function createOrder(
  values: z.infer<typeof OrderSchema>,
  userId: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Campos inválidos. Por favor revise el formulario." };
  }
  
  const data = validatedFields.data;
  const newOrderNumber = generateOrderNumber();
  const newOrder: Order = {
    id: newOrderNumber,
    orderNumber: newOrderNumber,
    ...data,
    entryDate: new Date().toISOString(),
    commentsHistory: [],
    status: "Recibido",
  };

  mockOrders.push(newOrder);
  return { success: true, message: `Orden ${newOrderNumber} creada exitosamente.`, order: newOrder };
}

export async function getOrders(filters?: { client?: string, orderNumber?: string, imei?: string, status?: string }): Promise<Order[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const clients = await getMockClients();

  let filteredOrders = mockOrders;

  if (filters) {
    if (filters.client) {
      // This is a simplified search. In a real app, you'd join tables or do a more complex query.
      const clientLower = filters.client.toLowerCase();
      const matchingClientIds = clients.filter(c => c.name.toLowerCase().includes(clientLower) || c.id.toLowerCase().includes(clientLower)).map(c => c.id);
      filteredOrders = filteredOrders.filter(o => matchingClientIds.includes(o.clientId));
    }
    if (filters.orderNumber) {
      filteredOrders = filteredOrders.filter(o => o.orderNumber.toLowerCase().includes(filters.orderNumber!.toLowerCase()));
    }
    if (filters.imei) {
      filteredOrders = filteredOrders.filter(o => o.deviceIMEI.includes(filters.imei!));
    }
    if (filters.status) {
      filteredOrders = filteredOrders.filter(o => o.status === filters.status);
    }
  }

  // Add client name to orders for easy display
  const ordersWithClientNames = filteredOrders.map(order => {
    const client = clients.find(c => c.id === order.clientId);
    return {
      ...order,
      clientName: client?.name || 'N/D',
      clientLastName: client?.lastName || '',
    };
  });

  return ordersWithClientNames.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}

export async function getOrderById(id: string): Promise<Order | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const order = mockOrders.find(o => o.id === id);
  return order || null;
}

export async function updateOrder(
  orderId: string,
  values: z.infer<typeof OrderSchema>,
  userId: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: "Datos inválidos para actualizar." };
  }

  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }

  mockOrders[orderIndex] = {
    ...mockOrders[orderIndex],
    ...validatedFields.data,
  };

  return { success: true, message: "Orden actualizada.", order: mockOrders[orderIndex] };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }

  mockOrders[orderIndex].status = status;
  if (status === "Listo para Entrega") {
    mockOrders[orderIndex].readyForPickupDate = new Date().toISOString();
  }

  return { success: true, message: "Estado de la orden actualizado.", order: mockOrders[orderIndex] };
}

export async function addOrderComment(
  orderId: string,
  commentText: string,
  userId: string
): Promise<{ success: boolean; message: string; comment?: OrderCommentType }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }
  const commentId = `cmt-${Date.now()}`;
  const newComment: OrderCommentType = {
    id: commentId,
    description: commentText,
    timestamp: new Date().toISOString(),
    userId,
  };

  mockOrders[orderIndex].commentsHistory.push(newComment);
  return { success: true, message: "Comentario agregado.", comment: newComment };
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
