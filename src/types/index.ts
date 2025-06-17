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
  uid: string; // Corresponds to id_usuario
  name: string; // Corresponds to nombre_usuario
  email: string;
  role: 'admin' | 'tecnico' | 'recepcionista'; // Updated roles
  status: UserStatus; 
  storeSettings?: StoreSettings;
  createdAt: Timestamp | Date | string; 
  updatedAt: Timestamp | Date | string;
}

export interface Client { 
  id: string; 
  name: string; 
  lastName: string; // Added lastName
  dni: string; 
  phone: string; 
  email?: string; 
  address?: string; 
  notes?: string; 
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export interface Checklist {
  marca_golpes: 'si' | 'no';
  cristal_astillado: 'si' | 'no';
  marco_roto: 'si' | 'no';
  tapa_astillada: 'si' | 'no';
  lente_camara: 'si' | 'no'; 
  enciende: 'si' | 'no';
  tactil_funciona: 'si' | 'no';
  imagen_pantalla: 'si' | 'no'; 
  botones_funcionales: 'si' | 'no';
  camara_trasera: 'si' | 'no'; 
  camara_delantera: 'si' | 'no'; 
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

  clientId: string; // Link to CLIENTES
  clientName?: string; // For display in lists, populated by getOrders
  clientLastName?: string; // For display in lists, populated by getOrders

  createdByUserId: string; 

  deviceBrand: string; 
  deviceModel: string; 
  deviceIMEI: string; 
  declaredFault: string; 
  unlockPatternInfo: UnlockPatternInfo; 

  damageRisk?: string; 
  pantalla_parcial?: boolean;
  equipo_sin_acceso?: boolean;
  perdida_informacion?: boolean;

  classification: Classification; 
  observations?: string; 

  status: OrderStatus; 
  previousOrderId?: string;

  entryDate: Timestamp | Date | string; 
  deliveryDate?: Timestamp | Date | string | null; 
  readyForPickupDate?: Timestamp | Date | string | null;


  commentsHistory: Comment[]; 

  checklist: Checklist; 

  orderCompanyName?: string;
  orderCompanyLogoUrl?: string;
  orderCompanyCuit?: string;
  orderCompanyAddress?: string;
  orderCompanyContactDetails?: string;
  orderWarrantyConditions?: string;
  orderPickupConditions?: string;
  orderAbandonmentPolicyDays60?: number;

  costSparePart: number;
  costLabor: number;
  costPending: number;

  lastUpdatedBy: string; 
  updatedAt: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;

  customerAccepted?: boolean;
  customerSignatureName?: string;
}

export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};

export interface Configurations extends StoreSettings {}
