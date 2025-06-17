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
    branchInfo: "Taller Principal (Admin)",
    deviceBrand: "Samsung", deviceModel: "Galaxy S21", deviceIMEI: "123456789012345", declaredFault: "Pantalla rota", 
    unlockPatternInfo: "Registrado en sistema", 
    checklist: CHECKLIST_ITEMS.reduce((acc, item) => { 
        if (item.id === 'consumoV') {
            (acc as any)[item.id] = "0.5A";
        } else if (item.id === 'mah') {
            (acc as any)[item.id] = "4000mAh";
        } else if (item.id === 'saleConHuella') {
            (acc as any)[item.id] = "si";
        } else if (item.id === 'equipo_doblado'){
            (acc as any)[item.id] = "no";
        }
         else if (item.type === 'boolean') {
            (acc as any)[item.id] = ['enciende', 'tactil', 'imagen', 'botones', 'cam_trasera', 'cam_delantera', 'vibrador', 'microfono', 'auricular', 'parlante', 'sensor_huella', 'senal', 'wifi_bluetooth', 'pin_carga', 'lente_camara'].includes(item.id) ? 'si' : 'no';
        } else { 
             (acc as any)[item.id] = "";
        }
        return acc;
    }, {} as Checklist),
    damageRisk: "Cristal trizado en esquina superior.", pantalla_parcial: true, equipo_sin_acceso: false, perdida_informacion: false,
    costSparePart: 15000, costLabor: 5000, costPending: 0,
    classification: "rojo", observations: "Cliente indica que se cayó.",
    customerAccepted: true, customerSignatureName: "Juan Perez",
    dataLossDisclaimerAccepted: true, 
    privacyPolicyAccepted: true,    
    status: "En Diagnóstico", previousOrderId: "",
    entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    promisedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Promised tomorrow
    commentsHistory: [
      { id: 'cmt-1', userId: 'tech123', userName: 'Carlos Técnico', description: 'Se confirma pantalla rota, posible daño en flex de display.', timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()}
    ],
    orderCompanyName: DEFAULT_STORE_SETTINGS.companyName,
    orderCompanyLogoUrl: DEFAULT_STORE_SETTINGS.companyLogoUrl,
    orderCompanyCuit: DEFAULT_STORE_SETTINGS.companyCuit,
    orderCompanyAddress: DEFAULT_STORE_SETTINGS.companyAddress,
    orderCompanyContactDetails: DEFAULT_STORE_SETTINGS.companyContactDetails,
    orderWarrantyConditions: DEFAULT_STORE_SETTINGS.warrantyConditions,
    pickupConditions: DEFAULT_STORE_SETTINGS.pickupConditions,
    
    orderSnapshottedUnlockDisclaimer: DEFAULT_STORE_SETTINGS.unlockDisclaimerText,
    orderSnapshottedAbandonmentPolicyText: DEFAULT_STORE_SETTINGS.abandonmentPolicyText,
    orderSnapshottedDataLossPolicyText: DEFAULT_STORE_SETTINGS.dataLossPolicyText,
    orderSnapshottedUntestedDevicePolicyText: DEFAULT_STORE_SETTINGS.untestedDevicePolicyText,
    orderSnapshottedBudgetVariationText: DEFAULT_STORE_SETTINGS.budgetVariationText,
    orderSnapshottedHighRiskDeviceText: DEFAULT_STORE_SETTINGS.highRiskDeviceText,
    orderSnapshottedPartialDamageDisplayText: DEFAULT_STORE_SETTINGS.partialDamageDisplayText,
    orderSnapshottedWarrantyVoidConditionsText: DEFAULT_STORE_SETTINGS.warrantyVoidConditionsText,
    orderSnapshottedPrivacyPolicy: DEFAULT_STORE_SETTINGS.privacyPolicyText,

    createdByUserId: "admin123", lastUpdatedBy: "tech123",
    updatedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
    branchInfo: "Sucursal Norte",
    deviceBrand: "Apple", deviceModel: "iPhone 12", deviceIMEI: "987654321098765", declaredFault: "No carga la batería", 
    unlockPatternInfo: "Registrado en sistema", 
    checklist: CHECKLIST_ITEMS.reduce((acc, item) => {
      (acc as any)[item.id] = (item.type === 'boolean') ? 'si' : (item.type === 'enum_saleConHuella' ? 'no_tiene' : '');
      if(item.id === 'pin_carga') (acc as any)[item.id] = 'no';
      if(item.id === 'equipo_doblado') (acc as any)[item.id] = 'no';
      return acc;
    }, {} as Checklist),
    damageRisk: "", pantalla_parcial: false, equipo_sin_acceso: false, perdida_informacion: false,
    costSparePart: 8000, costLabor: 4000, costPending: 0,
    classification: "verde", observations: "Probable falla en pin de carga o batería.",
    customerAccepted: true, customerSignatureName: "Maria Lopez",
    dataLossDisclaimerAccepted: true, privacyPolicyAccepted: true,    
    status: "En Reparación", previousOrderId: "",
    entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    promisedDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Promised yesterday (already late)
    commentsHistory: [
      { id: 'cmt-2a', userId: 'tech123', userName: 'Carlos Técnico', description: 'Diagnóstico: pin de carga defectuoso. Cliente aprueba presupuesto.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()},
      { id: 'cmt-2b', userId: 'tech123', userName: 'Carlos Técnico', description: 'Repuesto solicitado. En espera.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()},
      { id: 'cmt-2c', userId: 'tech123', userName: 'Carlos Técnico', description: 'Repuesto recibido. Iniciando reparación.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()}
    ],
    orderCompanyName: "JO-SERVICE (Ejemplo)",
    orderCompanyLogoUrl: DEFAULT_STORE_SETTINGS.companyLogoUrl,
    orderCompanyCuit: DEFAULT_STORE_SETTINGS.companyCuit,
    orderCompanyAddress: "Av. Corrientes 123, CABA",
    orderCompanyContactDetails: DEFAULT_STORE_SETTINGS.companyContactDetails,
    orderWarrantyConditions: DEFAULT_STORE_SETTINGS.warrantyConditions,
    pickupConditions: DEFAULT_STORE_SETTINGS.pickupConditions,
    orderSnapshottedUnlockDisclaimer: DEFAULT_STORE_SETTINGS.unlockDisclaimerText,
    orderSnapshottedAbandonmentPolicyText: DEFAULT_STORE_SETTINGS.abandonmentPolicyText,
    orderSnapshottedDataLossPolicyText: DEFAULT_STORE_SETTINGS.dataLossPolicyText,
    orderSnapshottedUntestedDevicePolicyText: DEFAULT_STORE_SETTINGS.untestedDevicePolicyText,
    orderSnapshottedBudgetVariationText: DEFAULT_STORE_SETTINGS.budgetVariationText,
    orderSnapshottedHighRiskDeviceText: DEFAULT_STORE_SETTINGS.highRiskDeviceText,
    orderSnapshottedPartialDamageDisplayText: DEFAULT_STORE_SETTINGS.partialDamageDisplayText,
    orderSnapshottedWarrantyVoidConditionsText: DEFAULT_STORE_SETTINGS.warrantyVoidConditionsText,
    orderSnapshottedPrivacyPolicy: DEFAULT_STORE_SETTINGS.privacyPolicyText,
    createdByUserId: "recepcionista123", lastUpdatedBy: "tech123",
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    hasWarranty: false,
  },
  {
    id: "ORD003", orderNumber: "ORD003",
    clientId: "CLI003", 
    branchInfo: "Taller Principal (Admin)",
    deviceBrand: "Xiaomi", deviceModel: "Redmi Note 10", deviceIMEI: "543210987654321", declaredFault: "No enciende", 
    unlockPatternInfo: "Sin patrón", 
    checklist: CHECKLIST_ITEMS.reduce((acc, item) => { 
        (acc as any)[item.id] = (item.type === 'boolean' && item.id !== 'enciende') ? 'no' : ((item.type === 'enum_saleConHuella') ? 'no_tiene' : '');
        if(item.id === 'enciende') (acc as any)[item.id] = 'no';
        if(item.id === 'equipo_doblado') (acc as any)[item.id] = 'no';
        return acc;
    }, {} as Checklist),
    damageRisk: "Equipo sin signos de daño externo.", pantalla_parcial: false, equipo_sin_acceso: true, perdida_informacion: true,
    costSparePart: 0, costLabor: 0, costPending: 0,
    classification: null, observations: "Cliente no recuerda qué pasó, simplemente se apagó.",
    customerAccepted: true, customerSignatureName: "Carlos Gomez",
    dataLossDisclaimerAccepted: true, 
    privacyPolicyAccepted: true,    
    status: "Recibido", previousOrderId: "",
    entryDate: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Entered 10 minutes ago
    promisedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Promised in 3 days
    commentsHistory: [],
    orderCompanyName: DEFAULT_STORE_SETTINGS.companyName,
    orderCompanyLogoUrl: DEFAULT_STORE_SETTINGS.companyLogoUrl,
    orderCompanyCuit: DEFAULT_STORE_SETTINGS.companyCuit,
    orderCompanyAddress: DEFAULT_STORE_SETTINGS.companyAddress,
    orderCompanyContactDetails: DEFAULT_STORE_SETTINGS.companyContactDetails,
    orderWarrantyConditions: DEFAULT_STORE_SETTINGS.warrantyConditions,
    pickupConditions: DEFAULT_STORE_SETTINGS.pickupConditions,
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
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    hasWarranty: false,
  },
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
  const settingsToSnapshot: StoreSettings = { ...DEFAULT_STORE_SETTINGS, ...userStoreSettings };

  const data = validatedFields.data;
  const newOrderNumber = generateOrderNumber();
  
  const newOrder: Order = {
    id: newOrderNumber,
    orderNumber: newOrderNumber,
    ...data, 
    unlockPatternInfo: data.unlockPatternInfo, 
    previousOrderId: data.previousOrderId || "",
    entryDate: new Date().toISOString(),
    promisedDeliveryDate: data.promisedDeliveryDate ? new Date(data.promisedDeliveryDate).toISOString() : null,
    commentsHistory: [],
    status: data.status || "Recibido", 
    
    orderCompanyName: settingsToSnapshot.companyName,
    orderCompanyLogoUrl: settingsToSnapshot.companyLogoUrl,
    orderCompanyCuit: settingsToSnapshot.companyCuit,
    orderCompanyAddress: settingsToSnapshot.companyAddress,
    orderCompanyContactDetails: settingsToSnapshot.companyContactDetails,
    
    // Snapshot all legal texts
    orderWarrantyConditions: settingsToSnapshot.warrantyConditions,
    pickupConditions: settingsToSnapshot.pickupConditions, // Snapshot pickupConditions
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
    warrantyType: data.hasWarranty ? data.warrantyType : null,
    warrantyStartDate: data.hasWarranty && data.warrantyStartDate ? data.warrantyStartDate : null,
    warrantyEndDate: data.hasWarranty && data.warrantyEndDate ? data.warrantyEndDate : null,
    warrantyCoveredItem: data.hasWarranty ? data.warrantyCoveredItem : "",
    warrantyNotes: data.hasWarranty ? data.warrantyNotes : "",
    
    customerAccepted: data.customerAccepted,
    customerSignatureName: data.customerSignatureName,
    dataLossDisclaimerAccepted: data.dataLossDisclaimerAccepted,
    privacyPolicyAccepted: data.privacyPolicyAccepted,
  };

  mockOrders.push(newOrder);
  return { success: true, message: `Orden ${newOrderNumber} creada exitosamente.`, order: JSON.parse(JSON.stringify(newOrder)) };
}

export async function getOrders(filters?: { 
  client?: string, 
  orderNumber?: string, 
  imei?: string, 
  status?: string,
  limit?: number, 
  sortBy?: 'createdAt' | 'updatedAt' | 'entryDate'
}): Promise<Order[]> {
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
  
  let sortedOrders = ordersWithClientNames;

  if (filters?.sortBy) {
    if (filters.sortBy === 'createdAt') {
      sortedOrders = ordersWithClientNames.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (filters.sortBy === 'updatedAt') {
      sortedOrders = ordersWithClientNames.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    } else if (filters.sortBy === 'entryDate') {
        sortedOrders = ordersWithClientNames.sort((a, b) => new Date(b.entryDate || 0).getTime() - new Date(a.entryDate || 0).getTime());
    }
  } else {
    // Default sort: newest first by entryDate, then updatedAt, then createdAt
    sortedOrders = ordersWithClientNames.sort((a, b) => 
      new Date(b.entryDate || b.updatedAt || b.createdAt || 0).getTime() - 
      new Date(a.entryDate || a.updatedAt || a.createdAt || 0).getTime()
    );
  }
  
  if (filters?.limit) {
    sortedOrders = sortedOrders.slice(0, filters.limit);
  }

  return JSON.parse(JSON.stringify(sortedOrders));
}

export async function getOrderById(id: string): Promise<Order | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const order = mockOrders.find(o => o.id === id);
  if (order) {
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
  values: Partial<Omit<Order, 'id' | 'orderNumber' | 'entryDate' | 'createdAt' | 'createdByUserId' | 'orderCompanyName' | 'orderCompanyLogoUrl' | 'orderCompanyCuit' | 'orderCompanyAddress' | 'orderCompanyContactDetails' | 'orderWarrantyConditions' | 'pickupConditions' | 'clientName' | 'clientLastName' >>,
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
  
  // Prepare the data for update, ensuring that any undefined fields in validatedFields.data
  // do not overwrite existing values in currentOrder unless explicitly set to null or a new value.
  const dataToUpdate = { ...validatedFields.data };
  
  // Explicitly handle promisedDeliveryDate conversion
  if (dataToUpdate.promisedDeliveryDate !== undefined) {
    dataToUpdate.promisedDeliveryDate = dataToUpdate.promisedDeliveryDate ? new Date(dataToUpdate.promisedDeliveryDate).toISOString() : null;
  }

  const updatedOrderData: Order = {
    ...currentOrder,
    ...dataToUpdate, 
    // Ensure specific fields that might be handled differently are explicitly set
    unlockPatternInfo: dataToUpdate.unlockPatternInfo ?? currentOrder.unlockPatternInfo,
    lastUpdatedBy: userId, 
    updatedAt: new Date().toISOString(),
    hasWarranty: dataToUpdate.hasWarranty ?? currentOrder.hasWarranty,
    warrantyType: (dataToUpdate.hasWarranty ?? currentOrder.hasWarranty) ? (dataToUpdate.warrantyType ?? currentOrder.warrantyType) : null,
    warrantyStartDate: (dataToUpdate.hasWarranty ?? currentOrder.hasWarranty) && dataToUpdate.warrantyStartDate ? dataToUpdate.warrantyStartDate : null,
    warrantyEndDate: (dataToUpdate.hasWarranty ?? currentOrder.hasWarranty) && dataToUpdate.warrantyEndDate ? dataToUpdate.warrantyEndDate : null,
    warrantyCoveredItem: (dataToUpdate.hasWarranty ?? currentOrder.hasWarranty) ? (dataToUpdate.warrantyCoveredItem ?? currentOrder.warrantyCoveredItem) : "",
    warrantyNotes: (dataToUpdate.hasWarranty ?? currentOrder.hasWarranty) ? (dataToUpdate.warrantyNotes ?? currentOrder.warrantyNotes) : "",
  };


  // Legal texts are snapshotted at creation and should not change on update.
  // They are already part of currentOrder and will be preserved by the spread operator.
  // However, if for some reason they need to be updated (e.g. a system-wide policy change affecting old orders - unlikely),
  // that would be a separate, specific action.

  mockOrders[orderIndex] = updatedOrderData;

  // Update related dates if status changes
  if (dataToUpdate.status) {
    if (dataToUpdate.status === "Listo para Entrega" && !mockOrders[orderIndex].readyForPickupDate) {
      mockOrders[orderIndex].readyForPickupDate = new Date().toISOString();
    } else if (dataToUpdate.status === "Entregado" && !mockOrders[orderIndex].deliveryDate) {
      mockOrders[orderIndex].deliveryDate = new Date().toISOString();
    }
  }

  return { success: true, message: "Orden actualizada exitosamente.", order: JSON.parse(JSON.stringify(mockOrders[orderIndex])) };
}
