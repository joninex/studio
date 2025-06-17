import type { Timestamp } from 'firebase/firestore'; // Using type for Firebase Timestamp

export type UserStatus = 'pending' | 'active' | 'denied';

export interface StoreSettings {
  id?: string; // e.g., 'user_config_uid'
  companyName?: string;
  companyLogoUrl?: string;
  companyCuit?: string;
  companyAddress?: string;
  companyContactDetails?: string;
  branchInfo?: string;
  warrantyConditions?: string;
  pickupConditions?: string;
  abandonmentPolicyDays30?: number;
  abandonmentPolicyDays60?: number;
  dataLossDisclaimerText?: string; // New
  privacyPolicyText?: string; // New
}

export type UserRole = 'admin' | 'tecnico' | 'recepcionista';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  storeSettings?: StoreSettings;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

export interface Client {
  id: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export interface Checklist {
  golpe: 'si' | 'no';
  cristal: 'si' | 'no';
  marco: 'si' | 'no';
  tapa: 'si' | 'no';
  lente_camara: 'si' | 'no';
  enciende: 'si' | 'no';
  tactil: 'si' | 'no';
  imagen: 'si' | 'no';
  botones: 'si' | 'no';
  cam_trasera: 'si' | 'no';
  cam_delantera: 'si' | 'no';
  vibrador: 'si' | 'no';
  microfono: 'si' | 'no';
  auricular: 'si' | 'no';
  parlante: 'si' | 'no';
  sensor_huella: 'si' | 'no';
  senal: 'si' | 'no';
  wifi_bluetooth: 'si' | 'no';
  pin_carga: 'si' | 'no';
  humedad: 'si' | 'no';
}

// unlockPatternInfo is now a string in Order
// export type UnlockPatternInfo = "tiene" | "no tiene" | "no recuerda" | "no proporciona" | "";

export type Classification = "rojo" | "verde" | "sin stock" | "";

export type OrderStatus =
  | "Recibido"
  | "En Diagnóstico"
  | "Presupuestado"
  | "Presupuesto Aprobado"
  | "En Espera de Repuestos"
  | "En Reparación"
  | "Reparado"
  | "En Control de Calidad"
  | "Listo para Entrega"
  | "Entregado"
  | "Presupuesto Rechazado"
  | "Sin Reparación";

export interface Comment {
  id?: string;
  userId: string;
  userName?: string;
  description: string;
  timestamp: Timestamp | Date | string;
}

export type WarrantyType = '30d' | '60d' | '90d' | 'custom' | '';

export interface Order {
  id?: string;
  orderNumber: string;

  clientId: string;
  clientName?: string; 
  clientLastName?: string; 

  createdByUserId: string; 

  deviceBrand: string;
  deviceModel: string;
  deviceIMEI: string;
  declaredFault: string;
  unlockPatternInfo: string; // Changed from UnlockPatternInfo enum

  damageRisk?: string; 
  pantalla_parcial?: boolean;
  equipo_sin_acceso?: boolean;
  perdida_informacion?: boolean; // This refers to the risk checkbox

  classification: Classification; 
  observations?: string;

  status: OrderStatus;
  previousOrderId?: string;

  entryDate: Timestamp | Date | string;
  deliveryDate?: Timestamp | Date | string | null;
  readyForPickupDate?: Timestamp | Date | string | null;

  commentsHistory: Comment[];

  checklist: Checklist;

  // Snapshot of store settings at time of order creation
  orderCompanyName?: string;
  orderCompanyLogoUrl?: string;
  orderCompanyCuit?: string;
  orderCompanyAddress?: string;
  orderCompanyContactDetails?: string;
  orderWarrantyConditions?: string;
  orderPickupConditions?: string;
  orderAbandonmentPolicyDays60?: number;
  branchInfo?: string; 
  orderSnapshottedDataLossDisclaimer?: string; // New
  orderSnapshottedPrivacyPolicy?: string; // New


  costSparePart: number;
  costLabor: number;
  costPending: number;

  lastUpdatedBy: string; 
  updatedAt: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;

  customerAccepted?: boolean; // General terms acceptance
  customerSignatureName?: string;
  dataLossDisclaimerAccepted?: boolean; // New
  privacyPolicyAccepted?: boolean; // New

  // Warranty Fields
  hasWarranty?: boolean;
  warrantyType?: WarrantyType;
  warrantyStartDate?: string | null; 
  warrantyEndDate?: string | null;   
  warrantyCoveredItem?: string;
  warrantyNotes?: string;
}

export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};

export interface Configurations extends StoreSettings {}
