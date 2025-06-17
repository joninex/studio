import type { Timestamp } from 'firebase/firestore'; // Using type for Firebase Timestamp

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'tecnico';
  createdAt: Timestamp | Date | string; // Allow string for mock, Date for client, Timestamp for Firestore
  updatedAt: Timestamp | Date | string;
}

export interface Checklist {
  carcasaMarks: 'si' | 'no';
  screenCrystal: 'si' | 'no';
  frame: 'si' | 'no';
  backCover: 'si' | 'no';
  camera: 'si' | 'no'; // Assuming this refers to external camera lens condition
  microphone: 'si' | 'no';
  speaker: 'si' | 'no';
  powersOn: 'si' | 'no';
  touchScreen: 'si' | 'no';
  deviceCamera: 'si' | 'no'; // Renamed from 'Camera' in functionality to avoid conflict
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
  id?: string; // Firestore document ID
  orderNumber: string;

  clientName: string;
  clientLastName: string;
  clientDni: string;
  clientPhone: string;
  clientEmail: string;

  branchInfo: string; // Preloaded, e.g., "JO-SERVICE Central"

  deviceBrand: string;
  deviceModel: string;
  deviceIMEI: string;
  declaredFault: string;
  unlockPatternInfo: UnlockPatternInfo;

  checklist: Checklist;

  damageRisk: string; // Text field
  specificSectors: string[]; // e.g., ["Pantallas con daño parcial"]

  costSparePart: number;
  costLabor: number;
  costPending: number;

  classification: Classification;
  observations: string;

  customerAccepted: boolean;
  customerSignatureName: string; // Name of customer who accepted

  status: OrderStatus;
  previousOrderId?: string; // For linking to a previous order

  entryDate: Timestamp | Date | string;
  readyForPickupDate?: Timestamp | Date | string | null;
  deliveryDate?: Timestamp | Date | string | null;

  commentsHistory: Comment[];

  lastUpdatedBy: string; // User ID
  updatedAt: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string; // Firestore typically adds this
}

export interface Configurations {
  id?: string; // e.g., 'general_config'
  companyName?: string;
  companyLogoUrl?: string;
  companyCuit?: string;
  companyAddress?: string;
  companyContactDetails?: string; // Renamed from contactInfo
  warrantyConditions: string;
  pickupConditions: string;
  abandonmentPolicyDays30: number;
  abandonmentPolicyDays60: number;
}

// For AI suggestion
export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};
