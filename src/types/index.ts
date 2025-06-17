import type { Timestamp } from 'firebase/firestore'; // Using type for Firebase Timestamp

export type UserStatus = 'pending' | 'active' | 'denied';

export interface StoreSettings {
  id?: string;
  companyName?: string;
  companyLogoUrl?: string;
  companyCuit?: string;
  companyAddress?: string;
  companyContactDetails?: string; 
  branchInfo?: string;

  warrantyConditions?: string; // General warranty text
  pickupConditions?: string; 
  
  // Detailed legal texts
  unlockDisclaimerText?: string;
  abandonmentPolicyText?: string; 
  dataLossPolicyText?: string; 
  untestedDevicePolicyText?: string;
  budgetVariationText?: string; 
  highRiskDeviceText?: string; 
  partialDamageDisplayText?: string; 
  warrantyVoidConditionsText?: string; // Specific to what voids warranty
  privacyPolicyText?: string; // Additional privacy policy text

  abandonmentPolicyDays30?: number; 
  abandonmentPolicyDays60?: number;
}

export type UserRole = 'admin' | 'tecnico' | 'recepcionista' | 'cadete' | 'proveedor_externo';

export interface User {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string; 
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
  equipo_doblado: 'si' | 'no'; 
  consumoV?: string; 
  mah?: string; 
  saleConHuella?: 'si' | 'no' | 'no_tiene'; 
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

export type WarrantyType = '30d' | '60d' | '90d' | 'custom' | null;

export interface Order {
  id?: string;
  orderNumber: string;

  clientId: string;
  clientName?: string; 
  clientLastName?: string; 

  createdByUserId: string; 

  branchInfo: string;
  deviceBrand: string;
  deviceModel: string;
  deviceIMEI: string;
  declaredFault: string;
  unlockPatternInfo: string; 

  damageRisk?: string; 
  pantalla_parcial?: boolean;
  equipo_sin_acceso?: boolean;
  perdida_informacion?: boolean;

  classification: Classification | null; 
  observations?: string;

  status: OrderStatus;
  previousOrderId?: string;

  entryDate: Timestamp | Date | string;
  promisedDeliveryDate?: Timestamp | Date | string | null;
  deliveryDate?: Timestamp | Date | string | null;
  readyForPickupDate?: Timestamp | Date | string | null;

  commentsHistory: Comment[];

  checklist: Checklist;

  orderCompanyName?: string;
  orderCompanyLogoUrl?: string;
  orderCompanyCuit?: string;
  orderCompanyAddress?: string; 
  orderCompanyContactDetails?: string; 

  orderSnapshottedUnlockDisclaimer?: string;
  orderSnapshottedAbandonmentPolicyText?: string;
  orderSnapshottedDataLossPolicyText?: string;
  orderSnapshottedUntestedDevicePolicyText?: string;
  orderSnapshottedBudgetVariationText?: string;
  orderSnapshottedHighRiskDeviceText?: string;
  orderSnapshottedPartialDamageDisplayText?: string;
  orderSnapshottedWarrantyVoidConditionsText?: string;
  orderSnapshottedPrivacyPolicy?: string;
  orderWarrantyConditions?: string; 
  pickupConditions?: string; 

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

// Inventory Types
export type PartCategory = 
  | "Pantalla" 
  | "Batería" 
  | "Placa Madre" 
  | "Cámara" 
  | "Pin de Carga" 
  | "Flex" 
  | "Carcasa" 
  | "Botón" 
  | "Sensor" 
  | "Altavoz/Auricular" 
  | "Antena"
  | "Tornillería"
  | "Otros Componentes"
  | "Accesorio"
  | "Herramienta"
  | "Insumo Taller";

export type PartUnit = "unidad" | "metro" | "kit" | "juego" | "litro" | "gramo";

export interface Part {
  id: string;
  name: string;
  sku?: string; // Stock Keeping Unit / Código
  description?: string;
  category?: PartCategory | ""; // Allow empty string for "no category"
  unit?: PartUnit;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock?: number;
  supplierInfo?: string; // Simple text for now, later could be Supplier ID
  notes?: string;
  imageUrl?: string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  cuit?: string;
  notes?: string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}
