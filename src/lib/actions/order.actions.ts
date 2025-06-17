// src/lib/actions/order.actions.ts
"use server";

import type { Order, User, Comment as OrderCommentType, StoreSettings, Client, WarrantyType, OrderStatus, Checklist } from "@/types";
import { OrderSchema } from "@/lib/schemas";
import type { z } from "zod";
import { suggestRepairSolutions } from "@/ai/flows/suggest-repair-solutions";
import { getStoreSettingsForUser } from "./settings.actions"; 
import { DEFAULT_STORE_SETTINGS, CHECKLIST_ITEMS } from "@/lib/constants";
import { getMockClients } from "./client.actions"; 


let mockOrders: Order[] = [
  {
    id: "ORD001", orderNumber: "ORD001",
    clientId: "CLI001", 
    branchInfo: "Taller Central (Admin)",
    deviceBrand: "Samsung", deviceModel: "Galaxy S21", deviceIMEI: "123456789012345", declaredFault: "Pantalla rota", 
    unlockPatternInfo: "1234", // Now a free text field
    checklist: CHECKLIST_ITEMS.reduce((acc, item) => { 
        if (item.id === 'consumoV') { // @ts-ignore
            acc[item.id] = "0.5A";
        } else if (item.id === 'mah') { // @ts-ignore
            acc[item.id] = "4000mAh";
        } else if (item.id === 'saleConHuella') { // @ts-ignore
            acc[item.id] = "si";
        } else if (item.type === 'boolean') { // @ts-ignore
            acc[item.id] = ['enciende', 'tactil', 'imagen', 'botones', 'cam_trasera', 'cam_delantera', 'vibrador', 'microfono', 'auricular', 'parlante', 'sensor_huella', 'senal', 'wifi_bluetooth', 'pin_carga', 'lente_camara', 'equipo_doblado'].includes(item.id) ? 'si' : 'no';
        } else { // @ts-ignore
             acc[item.id] = "";
        }
        return acc;
    }, {} as Checklist),
    damageRisk: "Cristal trizado en esquina superior.", pantalla_parcial: true, equipo_sin_acceso: false, perdida_informacion: false,
    costSparePart: 15000, costLabor: 5000, costPending: 0,
    classification: "rojo", observations: "Cliente indica que se cayó.",
    customerAccepted: true, customerSignatureName: "Juan Perez",
    dataLossDisclaimerAccepted: true, // Corresponds to dataLossPolicyText
    privacyPolicyAccepted: true,    // Corresponds to privacyPolicyText
    status: "En Diagnóstico", previousOrderId: "",
    entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    commentsHistory: [],
    // Snapshotted store settings
    orderCompanyName: DEFAULT_STORE_SETTINGS.companyName,
    orderCompanyLogoUrl: DEFAULT_STORE_SETTINGS.companyLogoUrl,
    orderCompanyCuit: DEFAULT_STORE_SETTINGS.companyCuit,
    orderCompanyAddress: DEFAULT_STORE_SETTINGS.companyAddress,
    orderCompanyContactDetails: DEFAULT_STORE_SETTINGS.companyContactDetails,
    orderWarrantyConditions: DEFAULT_STORE_SETTINGS.warrantyConditions,
    
    // Snapshotted specific legal texts
    orderSnapshottedUnlockDisclaimer: DEFAULT_STORE_SETTINGS.unlockDisclaimerText,
    orderSnapshottedAbandonmentPolicyText: DEFAULT_STORE_SETTINGS.abandonmentPolicyText,
    orderSnapshottedDataLossPolicyText: DEFAULT_STORE_SETTINGS.dataLossPolicyText,
    orderSnapshottedUntestedDevicePolicyText: DEFAULT_STORE_SETTINGS.untestedDevicePolicyText,
    orderSnapshottedBudgetVariationText: DEFAULT_STORE_SETTINGS.budgetVariationText,
    orderSnapshottedHighRiskDeviceText: DEFAULT_STORE_SETTINGS.highRiskDeviceText,
    orderSnapshottedPartialDamageDisplayText: DEFAULT_STORE_SETTINGS.partialDamageDisplayText,
    orderSnapshottedWarrantyVoidConditionsText: DEFAULT_STORE_SETTINGS.warrantyVoidConditionsText,
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
];
let orderCounter = mockOrders.length;

function generateOrderNumber(): string {
  orderCounter += 1;
  return `ORD${String(orderCounter).padStart(3, '0')}`;
}

// TODO: Implement actual encryption/decryption for unlockPatternInfo
// async function encryptUnlockPattern(pattern: string): Promise<string> { return `encrypted_${pattern}`; }
// async function decryptUnlockPattern(encryptedPattern: string): Promise<string> { return encryptedPattern.replace('encrypted_', ''); }

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
  const settingsToSnapshot: StoreSettings = { ...DEFAULT_STORE_SETTINGS, ...userStoreSettings };

  const data = validatedFields.data;
  const newOrderNumber = generateOrderNumber();
  
  // const encryptedUnlockPattern = await encryptUnlockPattern(data.unlockPatternInfo); // TODO: Encrypt

  const newOrder: Order = {
    id: newOrderNumber,
    orderNumber: newOrderNumber,
    ...data, 
    // unlockPatternInfo: encryptedUnlockPattern, // Store encrypted
    unlockPatternInfo: data.unlockPatternInfo, // Storing plain for mock
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
    
    // Snapshot specific legal texts
    orderSnapshottedUnlockDisclaimer: settingsToSnapshot.unlockDisclaimerText,
    orderSnapshottedAbandonmentPolicyText: settingsToSnapshot.abandonmentPolicyText,
    orderSnapshottedDataLossPolicyText: settingsToSnapshot.dataLossPolicyText,
    orderSnapshottedUntestedDevicePolicyText: settingsToSnapshot.untestedDevicePolicyText,
    orderSnapshottedBudgetVariationText: settingsToSnapshot.budgetVariationText,
    orderSnapshottedHighRiskDeviceText: settingsToSnapshot.highRiskDeviceText,
    orderSnapshottedPartialDamageDisplayText: settingsToSnapshot.partialDamageDisplayText,
    orderSnapshottedWarrantyVoidConditionsText: settingsToSnapshot.warrantyVoidConditionsText,
    orderSnapshottedPrivacyPolicy: settingsToSnapshot.privacyPolicyText,

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
    // const decryptedOrder = { ...order, unlockPatternInfo: await decryptUnlockPattern(order.unlockPatternInfo) }; // TODO: Decrypt
    // return JSON.parse(JSON.stringify(decryptedOrder));
    return JSON.parse(JSON.stringify(order)); // Returning plain for mock
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
  values: Partial<Omit<Order, 'id' | 'orderNumber' | 'entryDate' | 'createdAt' | 'createdByUserId' | 'orderCompanyName' | 'orderCompanyLogoUrl' | 'orderCompanyCuit' | 'orderCompanyAddress' | 'orderCompanyContactDetails' | 'orderWarrantyConditions' | 'clientName' | 'clientLastName' >>,
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
  
  const currentOrder = mockOrders[orderIndex];
  
  // if (validatedFields.data.unlockPatternInfo && validatedFields.data.unlockPatternInfo !== currentOrder.unlockPatternInfo) {
  //   validatedFields.data.unlockPatternInfo = await encryptUnlockPattern(validatedFields.data.unlockPatternInfo); // TODO: Encrypt if changed
  // }


  const updatedOrderData: Order = {
    ...currentOrder,
    ...validatedFields.data, 
    unlockPatternInfo: validatedFields.data.unlockPatternInfo || currentOrder.unlockPatternInfo, // Use new if provided, else keep old
    lastUpdatedBy: userId, 
    updatedAt: new Date().toISOString(),
  };

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
