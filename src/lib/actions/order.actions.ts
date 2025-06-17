// src/lib/actions/order.actions.ts
"use server";

import type { Order, User, Comment, AISuggestion } from "@/types";
import { OrderSchema } from "@/lib/schemas";
import type { z } from "zod";
import { suggestRepairSolutions } from "@/ai/flows/suggest-repair-solutions";

// Mock database for orders
let mockOrders: Order[] = [
  // Sample data
  {
    id: "ORD001",
    orderNumber: "ORD001",
    clientName: "Juan",
    clientLastName: "Perez",
    clientDni: "12345678",
    clientPhone: "1122334455",
    clientEmail: "juan.perez@example.com",
    branchInfo: "JO-SERVICE Taller Central (Config)",
    deviceBrand: "Samsung",
    deviceModel: "Galaxy S21",
    deviceIMEI: "123456789012345",
    declaredFault: "Pantalla rota",
    unlockPatternInfo: "No tiene",
    checklist: {
      carcasaMarks: "si", screenCrystal: "si", frame: "no", backCover: "no", camera: "si",
      microphone: "si", speaker: "si", powersOn: "si", touchScreen: "no", deviceCamera: "si",
      fingerprintSensor: "si", signal: "si", wifi: "si",
    },
    damageRisk: "Cristal trizado en esquina superior.",
    specificSectors: ["Pantallas con daño parcial"],
    costSparePart: 15000,
    costLabor: 5000,
    costPending: 0,
    classification: "",
    observations: "Cliente indica que se cayó.",
    customerAccepted: true,
    customerSignatureName: "Juan Perez",
    status: "En diagnóstico",
    previousOrderId: "",
    entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    commentsHistory: [],
    lastUpdatedBy: "admin123",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "ORD002",
    orderNumber: "ORD002",
    clientName: "Maria",
    clientLastName: "Lopez",
    clientDni: "87654321",
    clientPhone: "5544332211",
    clientEmail: "maria.lopez@example.com",
    branchInfo: "JO-SERVICE Taller Norte (Config)",
    deviceBrand: "Apple",
    deviceModel: "iPhone 12",
    deviceIMEI: "543210987654321",
    declaredFault: "No enciende, batería agotada.",
    unlockPatternInfo: "No recuerda/sabe",
    checklist: {
      carcasaMarks: "no", screenCrystal: "no", frame: "no", backCover: "no", camera: "si",
      microphone: "si", speaker: "si", powersOn: "no", touchScreen: "si", deviceCamera: "si",
      fingerprintSensor: "si", signal: "si", wifi: "si",
    },
    damageRisk: "",
    specificSectors: ["Equipos sin clave o que no encienden"],
    costSparePart: 0,
    costLabor: 0,
    costPending: 8000,
    classification: "Para stock (rojo)",
    observations: "Revisar pin de carga también.",
    customerAccepted: true,
    customerSignatureName: "Maria Lopez",
    status: "Esperando pieza",
    previousOrderId: "ORD001", // Example of linked order
    entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    commentsHistory: [{ comment: "Batería solicitada", timestamp: new Date().toISOString(), user: "Carlos Técnico" }],
    lastUpdatedBy: "tech123",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
];
let orderCounter = mockOrders.length;

function generateOrderNumber(): string {
  orderCounter += 1;
  return `ORD${String(orderCounter).padStart(3, '0')}`;
}

export async function createOrder(
  values: z.infer<typeof OrderSchema>,
  userId: string // ID of the user creating the order
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Campos inválidos. Por favor revise el formulario." };
  }

  const data = validatedFields.data;
  const newOrderNumber = generateOrderNumber();

  const newOrder: Order = {
    id: newOrderNumber, // Using orderNumber as ID for mock
    orderNumber: newOrderNumber,
    ...data, // This includes branchInfo from the form
    previousOrderId: data.previousOrderId || "", // Ensure it's set
    entryDate: new Date().toISOString(),
    commentsHistory: [],
    lastUpdatedBy: userId,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  mockOrders.push(newOrder);
  return { success: true, message: `Orden ${newOrderNumber} creada exitosamente.`, order: newOrder };
}

export async function getOrders(filters?: { client?: string, orderNumber?: string, imei?: string, status?: string }): Promise<Order[]> {
  // Simulate fetching orders
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

  let filteredOrders = mockOrders;

  if (filters) {
    if (filters.client) {
      const clientLower = filters.client.toLowerCase();
      filteredOrders = filteredOrders.filter(o =>
        o.clientName.toLowerCase().includes(clientLower) ||
        o.clientLastName.toLowerCase().includes(clientLower)
      );
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

  // Sort by entryDate descending
  return [...filteredOrders].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}

export async function getOrderById(id: string): Promise<Order | null> {
  // Simulate fetching an order by ID
  await new Promise(resolve => setTimeout(resolve, 300));
  const order = mockOrders.find(o => o.id === id);
  return order || null;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
  userId: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }

  mockOrders[orderIndex].status = status;
  mockOrders[orderIndex].lastUpdatedBy = userId;
  mockOrders[orderIndex].updatedAt = new Date().toISOString();

  if (status === "Listo para Retirar" && !mockOrders[orderIndex].readyForPickupDate) {
    mockOrders[orderIndex].readyForPickupDate = new Date().toISOString();
  } else if (status === "Entregado" && !mockOrders[orderIndex].deliveryDate) {
    mockOrders[orderIndex].deliveryDate = new Date().toISOString();
  }


  return { success: true, message: "Estado de la orden actualizado.", order: mockOrders[orderIndex] };
}

export async function addOrderComment(
  orderId: string,
  commentText: string,
  user: User // User object or just name/ID
): Promise<{ success: boolean; message: string; comment?: Comment }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }

  const newComment: Comment = {
    comment: commentText,
    timestamp: new Date().toISOString(),
    user: user.name, // Using user's name for simplicity
  };

  mockOrders[orderIndex].commentsHistory.push(newComment);
  mockOrders[orderIndex].lastUpdatedBy = user.uid;
  mockOrders[orderIndex].updatedAt = new Date().toISOString();

  return { success: true, message: "Comentario agregado.", comment: newComment };
}

export async function updateOrderCosts(
  orderId: string,
  costs: { costSparePart?: number, costLabor?: number, costPending?: number },
  userId: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }

  if (costs.costSparePart !== undefined) mockOrders[orderIndex].costSparePart = costs.costSparePart;
  if (costs.costLabor !== undefined) mockOrders[orderIndex].costLabor = costs.costLabor;
  if (costs.costPending !== undefined) mockOrders[orderIndex].costPending = costs.costPending;

  mockOrders[orderIndex].lastUpdatedBy = userId;
  mockOrders[orderIndex].updatedAt = new Date().toISOString();

  return { success: true, message: "Costos actualizados.", order: mockOrders[orderIndex] };
}


export async function getRepairSuggestions(
  deviceModel: string,
  faultDescription: string
): Promise<{ success: boolean; message?: string; suggestion?: AISuggestion }> {
  try {
    const result = await suggestRepairSolutions({ deviceModel, faultDescription });
    return { success: true, suggestion: result };
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return { success: false, message: "Error al obtener sugerencias de la IA." };
  }
}

// Full order update (for editing more fields)
export async function updateOrder(
  orderId: string,
  values: Partial<Omit<Order, 'id' | 'orderNumber' | 'entryDate' | 'createdAt'>>,
  userId: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.partial().safeParse(values); 

  if (!validatedFields.success) {
    console.error("Update Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de actualización inválidos." };
  }


  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }

  mockOrders[orderIndex] = {
    ...mockOrders[orderIndex],
    ...validatedFields.data, 
    lastUpdatedBy: userId,
    updatedAt: new Date().toISOString(),
  };

  if (validatedFields.data.status) {
    if (validatedFields.data.status === "Listo para Retirar" && !mockOrders[orderIndex].readyForPickupDate) {
      mockOrders[orderIndex].readyForPickupDate = new Date().toISOString();
    } else if (validatedFields.data.status === "Entregado" && !mockOrders[orderIndex].deliveryDate) {
      mockOrders[orderIndex].deliveryDate = new Date().toISOString();
    }
  }


  return { success: true, message: "Orden actualizada exitosamente.", order: mockOrders[orderIndex] };
}
