import type { Timestamp } from 'firebase/firestore'; // Using type for Firebase Timestamp

export type UserStatus = 'pending' | 'active' | 'denied';

export interface StoreSettings {
  id?: string;
  companyName?: string;
  companyLogoUrl?: string;
  companyCuit?: string;
  companyAddress?: string;
  companyContactDetails?: string; // Should allow for phone, WhatsApp, address as in user example
  branchInfo?: string;

  // Existing legal/policy texts
  warrantyConditions?: string; // General warranty conditions from store
  pickupConditions?: string; // General pickup conditions
  abandonmentPolicyDays30?: number; // Kept for logic if needed, main text in abandonmentPolicyText
  abandonmentPolicyDays60?: number; // Kept for logic if needed, main text in abandonmentPolicyText
  dataLossDisclaimerText?: string; 
  privacyPolicyText?: string; 

  // New specific legal texts from user's detailed example
  importantUnlockDisclaimer?: string; // "Importante: Si no se informa el desbloqueo..."
  abandonmentPolicyText?: string; // Detailed abandonment policy text "Si el equipo no se retira en 30 días..."
  dataRetrievalPolicyText?: string; // "Pérdida de Información: TecnoLand no se responsabiliza..."
  untestedDevicePolicyText?: string; // "Equipos sin Encender o con Clave/Patrón no Informado..."
  budgetVariationText?: string; // "Presupuesto: El presupuesto se basa en la falla declarada..."
  highRiskDeviceText?: string; // "Teléfonos con Riesgos: Se informa sobre riesgos especiales..."
  partialDamageDisplayText?: string; // "Pantallas con Daño Parcial: Se advierte que una falla parcial..."
  warrantyVoidConditionsText?: string; // Detailed "Anulación de Garantía" list
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
  // Existing items
  golpe: 'si' | 'no'; // MARCAS O GOLPES EN CARCASA
  cristal: 'si' | 'no'; // CRISTAL ASTILLADO
  marco: 'si' | 'no'; // MARCO ROTO
  tapa: 'si' | 'no'; // TAPA ASTILLADA
  lente_camara: 'si' | 'no'; // LENTE DE CÁMARA OK
  enciende: 'si' | 'no'; // ENCIENDE
  tactil: 'si' | 'no'; // TÁCTIL FUNCIONANDO
  imagen: 'si' | 'no'; // EMITE IMAGEN
  botones: 'si' | 'no'; // BOTONES FUNCIONALES
  cam_trasera: 'si' | 'no'; // CÁMARA TRASERA
  cam_delantera: 'si' | 'no'; // CÁMARA DELANTERA
  vibrador: 'si' | 'no'; // VIBRADOR
  microfono: 'si' | 'no'; // MICRÓFONO
  auricular: 'si' | 'no'; // AURICULAR
  parlante: 'si' | 'no'; // PARLANTE
  sensor_huella: 'si' | 'no'; // SENSOR DE HUELLA FUNCIONAL
  senal: 'si' | 'no'; // SEÑAL FUNCIONAL
  wifi_bluetooth: 'si' | 'no'; // WIFI/BT
  pin_carga: 'si' | 'no'; // PIN DE CARGA EN BUEN ESTADO
  humedad: 'si' | 'no'; // SIGNOS DE HUMEDAD
  // New items from user example
  equipo_doblado: 'si' | 'no'; // EQUIPO DOBLADO
  consumoV?: string; // Consumo V: (text input)
  mah?: string; // mAh: (text input)
  saleConHuella?: 'si' | 'no' | 'no_tiene'; // Sale con huella: Si / No / No tiene
}


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
  unlockPatternInfo: string; 

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

  // Snapshot of store settings at time of order creation
  orderCompanyName?: string;
  orderCompanyLogoUrl?: string;
  orderCompanyCuit?: string;
  orderCompanyAddress?: string; // Should be full address from StoreSettings
  orderCompanyContactDetails?: string; // Should include phone, WhatsApp, etc. from StoreSettings

  // General warranty text from store, distinct from extended warranty below
  orderWarrantyConditions?: string; 
  orderPickupConditions?: string; // General pickup conditions (might be part of abandonmentPolicyText)
  
  // Specific snapshotted legal texts
  orderSnapshottedDataLossDisclaimer?: string;
  orderSnapshottedPrivacyPolicy?: string;
  orderSnapshottedImportantUnlockDisclaimer?: string;
  orderSnapshottedAbandonmentPolicyText?: string;
  orderSnapshottedDataRetrievalPolicyText?: string;
  orderSnapshottedUntestedDevicePolicyText?: string;
  orderSnapshottedBudgetVariationText?: string;
  orderSnapshottedHighRiskDeviceText?: string;
  orderSnapshottedPartialDamageDisplayText?: string;
  orderSnapshottedWarrantyVoidConditionsText?: string; // For the detailed "Anulación de Garantía"


  costSparePart: number;
  costLabor: number;
  costPending: number;

  lastUpdatedBy: string; 
  updatedAt: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;

  customerAccepted?: boolean; 
  customerSignatureName?: string;
  dataLossDisclaimerAccepted?: boolean; 
  privacyPolicyAccepted?: boolean; 

  hasWarranty?: boolean; // For extended warranty
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
