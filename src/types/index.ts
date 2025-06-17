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
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'tecnico';
  status: UserStatus; // Added for registration approval
  storeSettings?: StoreSettings; // Added for user-specific settings
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

export interface Checklist {
  carcasaMarks: 'si' | 'no';
  screenCrystal: 'si' | 'no';
  frame: 'si' | 'no';
  backCover: 'si' | 'no';
  camera: 'si' | 'no';
  microphone: 'si' | 'no';
  speaker: 'si' | 'no';
  powersOn: 'si' | 'no';
  touchScreen: 'si' | 'no';
  deviceCamera: 'si' | 'no';
  fingerprintSensor: 'si' | 'no';
  signal: 'si' | 'no';
  wifi: 'si' | 'no';
}

export type UnlockPatternInfo = "No tiene" | "No recuerda/sabe" | "No desea informarla";
export type Classification = "Para stock (rojo)" | "Para stock (verde)" | "";
export type OrderStatus =
  | "En diagnóstico"
  | "Esperando pieza"
  | "Reparado"
  | "Listo para Retirar"
  | "Entregado"
  | "Abandonado"
  | "";

export interface Comment {
  comment: string;
  timestamp: Timestamp | Date | string;
  user: string; // User's name or ID
}

export interface Order {
  id?: string;
  orderNumber: string;

  clientName: string;
  clientLastName: string;
  clientDni: string;
  clientPhone: string;
  clientEmail: string;

  branchInfo: string; // This will default from creating user's settings but can be overridden on the form

  deviceBrand: string;
  deviceModel: string;
  deviceIMEI: string;
  declaredFault: string;
  unlockPatternInfo: UnlockPatternInfo;

  checklist: Checklist;

  damageRisk: string;
  specificSectors: string[];

  costSparePart: number;
  costLabor: number;
  costPending: number;

  classification: Classification;
  observations: string;

  customerAccepted: boolean;
  customerSignatureName: string;

  status: OrderStatus;
  previousOrderId?: string;

  entryDate: Timestamp | Date | string;
  readyForPickupDate?: Timestamp | Date | string | null;
  deliveryDate?: Timestamp | Date | string | null;

  commentsHistory: Comment[];

  // Store snapshot fields for printing
  orderCompanyName?: string;
  orderCompanyLogoUrl?: string;
  orderCompanyCuit?: string;
  orderCompanyAddress?: string;
  orderCompanyContactDetails?: string;
  orderWarrantyConditions?: string;
  orderPickupConditions?: string;
  orderAbandonmentPolicyDays60?: number;


  createdByUserId: string; // User ID of the order creator
  lastUpdatedBy: string; // User ID
  updatedAt: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;
}

// For AI suggestion
export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};

// Deprecated, use StoreSettings instead if needed for global fallbacks,
// but primary settings are now per-user.
export interface Configurations extends StoreSettings {}
