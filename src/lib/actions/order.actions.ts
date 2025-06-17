// src/lib/actions/order.actions.ts
"use server";

import type { Order, User, Comment as OrderCommentType, StoreSettings, Client, WarrantyType, OrderStatus } from "@/types";
import { OrderSchema } from "@/lib/schemas";
import type { z } from "zod";
import { suggestRepairSolutions } from "@/ai/flows/suggest-repair-solutions";
import { getStoreSettingsForUser } from "./settings.actions"; 
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { getMockClients } from "./client.actions"; 


let mockOrders: Order[] = [
  {
    id: "ORD001", orderNumber: "ORD001",
    clientId: "CLI001", 
    branchInfo: "Taller Central (Admin)",
    deviceBrand: "Samsung", deviceModel: "Galaxy S21", deviceIMEI: "123456789012345", declaredFault: "Pantalla rota", 
    unlockPatternInfo: "1234", // Changed to string
    checklist: { golpe: "si", cristal: "si", marco: "no", tapa: "no", lente_camara: "si", enciende: "si", tactil: "no", imagen: "si", botones: "si", cam_trasera: "si", cam_delantera: "si", vibrador: "si", microfono: "si", auricular: "si", parlante: "si", sensor_huella: "si", senal: "si", wifi_bluetooth: "si", pin_carga: "si", humedad: "no"},
    damageRisk: "Cristal trizado en esquina superior.", pantalla_parcial: true, equipo_sin_acceso: false, perdida_informacion: false,
    costSparePart: 15000, costLabor: 5000, costPending: 0,
    classification: "", observations: "Cliente indica que se cayó.",
    customerAccepted: true, customerSignatureName: "Juan Perez",
    dataLossDisclaimerAccepted: true,
    privacyPolicyAccepted: true,
    status: "En Diagnóstico", previousOrderId: "",
    entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    commentsHistory: [],
    orderCompanyName: "JO-SERVICE Admin Store",
    orderCompanyLogoUrl: "https://placehold.co/150x50.png?text=JO-SERVICE",
    orderCompanyCuit: "30-12345678-9",
    orderCompanyAddress: "Admin Main Street 123",
    orderCompanyContactDetails: "Tel: (011) 1111-1111",
    orderWarrantyConditions: "Admin warranty",
    orderPickupConditions: "Admin pickup",
    orderAbandonmentPolicyDays60: 60,
    orderSnapshottedDataLossDisclaimer: DEFAULT_STORE_SETTINGS.dataLossDisclaimerText,
    orderSnapshottedPrivacyPolicy: DEFAULT_STORE_SETTINGS.privacyPolicyText,
    createdByUserId: "admin123", lastUpdatedBy: "admin123",
    updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    hasWarranty: true,
    warrantyType: '90d',
    warrantyStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    warrantyEndDate: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    warrantyCoveredItem: "Pantalla completa",
    warrantyNotes: "Garantía no cubre daños por líquidos o mal uso.",
  },
  {
    id: "ORD002", orderNumber: "ORD002",
    clientId: "CLI002", 
    branchInfo: "Taller Norte (Carlos)",
    deviceBrand: "Apple", deviceModel: "iPhone 12", deviceIMEI: "543210987654321", declaredFault: "No enciende, batería agotada.", 
    unlockPatternInfo: "No recuerda", // Changed to string
    checklist: { golpe: "no", cristal: "no", marco: "no", tapa: "no", lente_camara: "si", enciende: "no", tactil: "si", imagen: "si", botones: "si", cam_trasera: "si", cam_delantera: "si", vibrador: "si", microfono: "si", auricular: "si", parlante: "si", sensor_huella: "si", senal: "si", wifi_bluetooth: "si", pin_carga: "si", humedad: "no"},
    damageRisk: "", pantalla_parcial: false, equipo_sin_acceso: true, perdida_informacion: false,
    costSparePart: 0, costLabor: 0, costPending: 8000,
    classification: "rojo", observations: "Revisar pin de carga también.",
    customerAccepted: true, customerSignatureName: "Maria Lopez",
    dataLossDisclaimerAccepted: true,
    privacyPolicyAccepted: false, // Example
    status: "En Espera de Repuestos", previousOrderId: "ORD001",
    entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    commentsHistory: [{ id: "cmt1", description: "Batería solicitada", timestamp: new Date().toISOString(), userId: "tech123", userName: "Carlos Técnico" }],
    orderCompanyName: "Carlos Tech Shop",
    orderCompanyLogoUrl: "https://placehold.co/150x50.png?text=Carlos+Shop",
    orderCompanyCuit: "20-87654321-5",
    orderCompanyAddress: "Tech Street 456",
    orderCompanyContactDetails: "Tel: (011) 2222-2222",
    orderWarrantyConditions: "Carlos warranty",
    orderPickupConditions: "Carlos pickup",
    orderAbandonmentPolicyDays60: 60,
    orderSnapshottedDataLossDisclaimer: "Ejemplo de descargo por pérdida de datos para esta orden.",
    orderSnapshottedPrivacyPolicy: "Ejemplo de política de privacidad para esta orden.",
    createdByUserId: "tech123", lastUpdatedBy: "tech123",
    updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    hasWarranty: false,
  }
];
let orderCounter = mockOrders.length;

function generateOrderNumber(): string {
  orderCounter += 1;
  return `ORD${String(orderCounter).padStart(3, '0')}`;
}

export async function createOrder(
  values: z.infer<typeof OrderSchema>,
  creatingUserId: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const validatedFields = OrderSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Campos inválidos. Por favor revise el formulario." };
  }

  const userStoreSettings = await getStoreSettingsForUser(creatingUserId);
  const settingsToSnapshot = { ...DEFAULT_STORE_SETTINGS, ...userStoreSettings };

  const data = validatedFields.data;
  const newOrderNumber = generateOrderNumber();
  
  // TODO: Encrypt data.unlockPatternInfo before saving to newOrder
  const finalUnlockPatternInfo = data.unlockPatternInfo; 

  const newOrder: Order = {
    id: newOrderNumber,
    orderNumber: newOrderNumber,
    ...data, 
    unlockPatternInfo: finalUnlockPatternInfo, // Store potentially encrypted value
    previousOrderId: data.previousOrderId || "",
    entryDate: new Date().toISOString(),
    commentsHistory: [],
    status: data.status || "Recibido", 
    
    orderCompanyName: settingsToSnapshot.companyName,
    orderCompanyLogoUrl: settingsToSnapshot.companyLogoUrl,
    orderCompanyCuit: settingsToSnapshot.companyCuit,
    orderCompanyAddress: settingsToSnapshot.companyAddress,
    orderCompanyContactDetails: settingsToSnapshot.companyContactDetails,
    orderWarrantyConditions: settingsToSnapshot.warrantyConditions,
    orderPickupConditions: settingsToSnapshot.pickupConditions,
    orderAbandonmentPolicyDays60: settingsToSnapshot.abandonmentPolicyDays60,
    orderSnapshottedDataLossDisclaimer: settingsToSnapshot.dataLossDisclaimerText, // Snapshot
    orderSnapshottedPrivacyPolicy: settingsToSnapshot.privacyPolicyText,       // Snapshot

    createdByUserId: creatingUserId,
    lastUpdatedBy: creatingUserId, 
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),

    hasWarranty: data.hasWarranty,
    warrantyType: data.warrantyType,
    warrantyStartDate: data.warrantyStartDate,
    warrantyEndDate: data.warrantyEndDate,
    warrantyCoveredItem: data.warrantyCoveredItem,
    warrantyNotes: data.warrantyNotes,
    
    // Explicitly set acceptance fields from validated data
    customerAccepted: data.customerAccepted,
    customerSignatureName: data.customerSignatureName,
    dataLossDisclaimerAccepted: data.dataLossDisclaimerAccepted,
    privacyPolicyAccepted: data.privacyPolicyAccepted,
  };

  mockOrders.push(newOrder);
  return { success: true, message: `Orden ${newOrderNumber} creada exitosamente.`, order: JSON.parse(JSON.stringify(newOrder)) };
}

export async function getOrders(filters?: { client?: string, orderNumber?: string, imei?: string, status?: string }): Promise<Order[]> {
  await new Promise(resolve => setTimeout(resolve, 500)); 
  const clients = await getMockClients(); 

  let filteredOrders = [...mockOrders];

  if (filters) {
    if (filters.client) {
      const clientLower = filters.client.toLowerCase();
      filteredOrders = filteredOrders.filter(o => {
        const client = clients.find(c => c.id === o.clientId);
        return client && (client.name.toLowerCase().includes(clientLower) || client.lastName.toLowerCase().includes(clientLower));
      });
    }
    if (filters.orderNumber) {
      filteredOrders = filteredOrders.filter(o => o.orderNumber.toLowerCase().includes(filters.orderNumber!.toLowerCase()));
    }
    if (filters.imei) {
      filteredOrders = filteredOrders.filter(o => o.deviceIMEI.includes(filters.imei!));
    }
    if (filters.status && filters.status !== "") { 
      filteredOrders = filteredOrders.filter(o => o.status === filters.status);
    }
  }
  
  const ordersWithClientNames = filteredOrders.map(order => {
    const client = clients.find(c => c.id === order.clientId);
    // TODO: Decrypt order.unlockPatternInfo if it was encrypted, for display purposes ONLY IF USER HAS PERMISSION
    return {
      ...order,
      clientName: client?.name || 'N/D',
      clientLastName: client?.lastName || '',
    };
  });
  
  return JSON.parse(JSON.stringify(ordersWithClientNames.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())));
}

export async function getOrderById(id: string): Promise<Order | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const order = mockOrders.find(o => o.id === id);
  if (order) {
    // TODO: Decrypt order.unlockPatternInfo if it was encrypted, for display purposes ONLY IF USER HAS PERMISSION
    return JSON.parse(JSON.stringify(order));
  }
  return null;
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
  mockOrders[orderIndex].lastUpdatedBy = userId; 
  mockOrders[orderIndex].updatedAt = new Date().toISOString();

  if (status === "Listo para Entrega" && !mockOrders[orderIndex].readyForPickupDate) {
    mockOrders[orderIndex].readyForPickupDate = new Date().toISOString();
  } else if (status === "Entregado" && !mockOrders[orderIndex].deliveryDate) {
    mockOrders[orderIndex].deliveryDate = new Date().toISOString();
  }

  return { success: true, message: "Estado de la orden actualizado.", order: JSON.parse(JSON.stringify(mockOrders[orderIndex])) };
}

export async function addOrderComment(
  orderId: string,
  commentText: string,
  user: Pick<User, 'uid' | 'name'> 
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
    userId: user.uid, 
    userName: user.name,
  };

  mockOrders[orderIndex].commentsHistory.push(newComment);
  mockOrders[orderIndex].lastUpdatedBy = user.uid; 
  mockOrders[orderIndex].updatedAt = new Date().toISOString();

  return { success: true, message: "Comentario agregado.", comment: JSON.parse(JSON.stringify(newComment)) };
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

  return { success: true, message: "Costos actualizados.", order: JSON.parse(JSON.stringify(mockOrders[orderIndex])) };
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

export async function updateOrder(
  orderId: string,
  values: Partial<Omit<Order, 'id' | 'orderNumber' | 'entryDate' | 'createdAt' | 'createdByUserId' | 'orderCompanyName' | 'orderCompanyLogoUrl' | 'orderCompanyCuit' | 'orderCompanyAddress' | 'orderCompanyContactDetails' | 'orderWarrantyConditions' | 'orderPickupConditions' | 'orderAbandonmentPolicyDays60' | 'clientName' | 'clientLastName' >>,
  userId: string 
): Promise<{ success: boolean; message: string; order?: Order }> {
  
  // Use a more specific partial schema for updates if needed, or rely on full OrderSchema parse
  const validatedFields = OrderSchema.partial().safeParse(values); 

  if (!validatedFields.success) {
    console.error("Update Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return { success: false, message: "Datos de actualización inválidos." };
  }

  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Orden no encontrada." };
  }
  
  const currentOrder = mockOrders[orderIndex];
  let finalUnlockPatternInfo = currentOrder.unlockPatternInfo;

  if (validatedFields.data.unlockPatternInfo && validatedFields.data.unlockPatternInfo !== currentOrder.unlockPatternInfo) {
    // TODO: Encrypt validatedFields.data.unlockPatternInfo if it's being changed
    finalUnlockPatternInfo = validatedFields.data.unlockPatternInfo;
  }


  const updatedOrderData: Order = {
    ...currentOrder,
    ...validatedFields.data, 
    unlockPatternInfo: finalUnlockPatternInfo, // Use potentially new/encrypted value
    lastUpdatedBy: userId, 
    updatedAt: new Date().toISOString(),
  };

  // Ensure clientId is correctly handled if passed in validatedFields.data
  if (validatedFields.data.clientId) {
    updatedOrderData.clientId = validatedFields.data.clientId;
  }
  
  mockOrders[orderIndex] = updatedOrderData;

  if (validatedFields.data.status) {
    if (validatedFields.data.status === "Listo para Entrega" && !mockOrders[orderIndex].readyForPickupDate) {
      mockOrders[orderIndex].readyForPickupDate = new Date().toISOString();
    } else if (validatedFields.data.status === "Entregado" && !mockOrders[orderIndex].deliveryDate) {
      mockOrders[orderIndex].deliveryDate = new Date().toISOString();
    }
  }

  return { success: true, message: "Orden actualizada exitosamente.", order: JSON.parse(JSON.stringify(mockOrders[orderIndex])) };
}
