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
  golpe: 'si' | 'no'; // Antes marca_golpes
  cristal: 'si' | 'no'; // Antes cristal_astillado
  marco: 'si' | 'no'; // Antes marco_roto
  tapa: 'si' | 'no'; // Antes tapa_astillada
  lente_camara: 'si' | 'no';
  enciende: 'si' | 'no';
  tactil: 'si' | 'no'; // Antes tactil_funciona
  imagen: 'si' | 'no'; // Antes imagen_pantalla
  botones: 'si' | 'no'; // Antes botones_funcionales
  cam_trasera: 'si' | 'no'; // Antes camara_trasera
  cam_delantera: 'si' | 'no'; // Antes camara_delantera
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

export type UnlockPatternInfo = "tiene" | "no tiene" | "no recuerda" | "no proporciona" | "";

export type Classification = "rojo" | "verde" | "sin stock" | "";

export type OrderStatus =
  | "ingreso"
  | "en diagnóstico"
  | "en reparación"
  | "esperando pieza"
  | "listo para retirar"
  | "entregado"
  | "abandonado"
  | "";

export interface Comment {
  id?: string;
  userId: string;
  userName?: string;
  description: string;
  timestamp: Timestamp | Date | string;
}

export interface Order {
  id?: string;
  orderNumber: string;

  clientId: string;
  clientName?: string; // For display in lists
  clientLastName?: string; // For display in lists

  createdByUserId: string; // FK to USUARIOS id_usuario

  deviceBrand: string; // Corresponds to marca
  deviceModel: string; // Corresponds to modelo
  deviceIMEI: string; // Corresponds to IMEI
  declaredFault: string; // Corresponds to falla_reportada
  unlockPatternInfo: UnlockPatternInfo; // Corresponds to patron_desbloqueo

  damageRisk?: string; // Corresponds to riesgo_rotura
  pantalla_parcial?: boolean;
  equipo_sin_acceso?: boolean;
  perdida_informacion?: boolean;

  classification: Classification; // Corresponds to para_stock
  observations?: string;

  status: OrderStatus;
  previousOrderId?: string;

  entryDate: Timestamp | Date | string; // Corresponds to fecha_ingreso
  deliveryDate?: Timestamp | Date | string | null; // Corresponds to fecha_salida

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
  branchInfo?: string; // Snapshot of branch info from user's store settings

  costSparePart: number; // Will be part of DIAGNOSTICOS later
  costLabor: number; // Will be part of DIAGNOSTICOS later
  costPending: number; // Will be part of DIAGNOSTICOS later

  lastUpdatedBy: string; // FK to USUARIOS id_usuario
  updatedAt: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;

  customerAccepted?: boolean;
  customerSignatureName?: string;
}

export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};

// Kept for settings page, represents User's Store Settings
export interface Configurations extends StoreSettings {}
