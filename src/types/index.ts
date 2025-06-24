import type { Timestamp } from 'firebase/firestore'; // Using type for Firebase Timestamp
import type { LucideIcon } from 'lucide-react';

export type UserStatus = 'pending' | 'active' | 'denied';

export type UserRole = 'admin' | 'tecnico' | 'recepcionista';

export interface StoreSettings {
    id: string;
    companyName: string;
    companyLogoUrl?: string;
    companyCuit?: string;
    companyAddress: string;
    companyContactDetails: string;
    branchInfo?: string;
    unlockDisclaimerText: string;
    abandonmentPolicyText: string;
    abandonmentPolicyDays30: number;
    abandonmentPolicyDays60: number;
    dataLossPolicyText: string;
    untestedDevicePolicyText: string;
    budgetVariationText: string;
    highRiskDeviceText: string;
    partialDamageDisplayText: string;
    warrantyVoidConditionsText: string;
    privacyPolicyText?: string;
    warrantyConditions: string;
    pickupConditions: string;
    intakeConformityText: string;
    clientVoucherLegalReminder: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  settings: StoreSettings;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UserAssignment {
    branchId: string;
    role: UserRole;
    sector: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string; 
  role: UserRole; // Global role, e.g. for super admin
  assignments?: UserAssignment[]; // Specific roles per branch
  status: UserStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type FiscalCondition = 'Consumidor Final' | 'Monotributista' | 'Responsable Inscripto' | 'Exento';


export interface Client {
  id: string;
  branchId: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  businessName?: string;
  cuit?: string;
  fiscalCondition?: FiscalCondition;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Checklist {
  // Estado Físico
  golpes_marcas?: 'si' | 'no' | 'sc';
  cristal_roto?: 'si' | 'no' | 'sc';
  marco_doblado?: 'si' | 'no' | 'sc';
  tapa_trasera?: 'si' | 'no' | 'sc';
  signos_humedad?: 'si' | 'no' | 'sc';
  
  // Encendido y Energía
  enciende: 'si' | 'no' | 'sc';
  consumo_voltaje?: string;
  bateria_mah?: string;
  
  // Pantalla y Controles
  imagen_pantalla: 'si' | 'no' | 'sc';
  respuesta_tactil: 'si' | 'no' | 'sc';
  botones_fisicos?: 'si' | 'no' | 'sc';
  sensor_huella_faceid?: 'si' | 'no' | 'sc';
  
  // Audio y Comunicaciones
  auricular_llamadas?: 'si' | 'no' | 'sc';
  altavoz_multimedia?: 'si' | 'no' | 'sc';
  microfono?: 'si' | 'no' | 'sc';
  vibrador?: 'si' | 'no' | 'sc';

  // Cámaras
  camara_trasera?: 'si' | 'no' | 'sc';
  camara_delantera?: 'si' | 'no' | 'sc';
  
  // Conectividad y Carga
  puerto_carga?: 'si' | 'no' | 'sc';
  wifi_bluetooth?: 'si' | 'no' | 'sc';
  senal_red_movil?: 'si' | 'no' | 'sc';
}

export type Classification = "rojo" | "verde" | "sin stock";

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
  id: string;
  userId: string;
  userName: string;
  description: string;
  timestamp: string | Date | Timestamp;
}

export interface AuditLogEntry {
    id: string;
    userId: string;
    userName: string;
    description: string;
    timestamp: string | Date | Timestamp;
}

export type PartCategory = "Pantalla" | "Batería" | "Flex" | "Cámara" | "Placa" | "Componente" | "Carcasa" | "Otro";
export type PartUnit = "unidad" | "metro" | "kit";

export interface Part {
    id: string;
    name: string;
    sku: string;
    description?: string;
    category?: PartCategory;
    unit: PartUnit;
    costPrice: number;
    salePrice: number;
    stock: number;
    minStock?: number;
    supplierInfo?: string;
    notes?: string;
    imageUrl?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    phone: string;
    email?: string;
    address?: string;
    cuit?: string;
    sellsDescription: string;
    notes?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface OrderPartItem {
    partId: string;
    partName: string;
    quantity: number;
    unitPrice: number; // This is the sale price per unit
    costPrice: number; // The cost per unit
}

export interface PaymentItem {
    id: string;
    amount: number;
    method: 'efectivo' | 'tarjeta' | 'transferencia';
    date: string | Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string; // NEW: Every order belongs to a branch
  clientId: string;
  clientName?: string;
  clientLastName?: string;
  clientPhone?: string;
  deviceBrand: string;
  deviceModel: string;
  deviceColor?: string;
  accessories?: string;
  deviceIMEI?: string;
  imeiNotVisible: boolean; // NEW: Track if IMEI was not visible at intake
  declaredFault: string;
  unlockPatternProvided: boolean; // NEW: Track if unlock code is given
  checklist: Checklist;
  damageRisk?: string;
  costSparePart: number;
  costLabor: number;
  observations?: string;
  status: OrderStatus;
  classification?: Classification | null;
  entryDate: string | Date | Timestamp;
  estimatedCompletionTime?: string;
  readyForPickupDate?: string | Date | Timestamp;
  deliveryDate?: string | Date | Timestamp;
  commentsHistory: Comment[];
  auditLog: AuditLogEntry[];
  intakeFormSigned: boolean;
  pickupFormSigned: boolean;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  partsUsed?: OrderPartItem[];
  paymentHistory?: PaymentItem[];
}

export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};

export interface CommonFault {
  id: string;
  activator: string; // e.g., "@noenciende"
  category: string;
  fullText: string;
  keywords: string[];
}

export interface Notification {
  id: string;
  userId: string; // The user who should receive the notification
  message: string;
  link: string; // The URL to navigate to when clicked
  read: boolean;
  createdAt: string | Date;
  icon?: LucideIcon; // Optional icon for visual distinction
}

export type MessageTemplateKey = 'INITIAL_CONTACT' | 'DIAGNOSIS_READY' | 'READY_FOR_PICKUP';
