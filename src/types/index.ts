import type { Timestamp } from 'firebase/firestore'; // Using type for Firebase Timestamp

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
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  settings: StoreSettings;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UserAssignment {
    branchId: string;
    role: UserRole;
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

export interface Client {
  id: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Checklist {
  golpe?: 'si' | 'no' | 'sc';
  cristal?: 'si' | 'no' | 'sc';
  marco?: 'si' | 'no' | 'sc';
  tapa?: 'si' | 'no' | 'sc';
  humedad?: 'si' | 'no' | 'sc';
  enciende: 'si' | 'no' | 'sc';
  consumoV?: string;
  mah?: string;
  imagen: 'si' | 'no' | 'sc';
  tactil: 'si' | 'no' | 'sc';
  botones?: 'si' | 'no' | 'sc';
  sensor_huella?: 'si' | 'no' | 'sc';
  cam_trasera?: 'si' | 'no' | 'sc';
  cam_delantera?: 'si' | 'no' | 'sc';
  microfono?: 'si' | 'no' | 'sc';
  auricular?: 'si' | 'no' | 'sc';
  parlante?: 'si' | 'no' | 'sc';
  vibrador?: 'si' | 'no' | 'sc';
  pin_carga?: 'si' | 'no' | 'sc';
  wifi_bluetooth?: 'si' | 'no' | 'sc';
  senal?: 'si' | 'no' | 'sc';
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
  description: string;
  timestamp: string | Date | Timestamp;
}

export type PartCategory = "Pantalla" | "Batería" | "Flex" | "Cámara" | "Placa" | "Componente" | "Carcasa" | "Otro" | "";
export type PartUnit = "unidad" | "metro" | "kit";

export interface Part {
    id: string;
    name: string;
    sku: string;
    description?: string;
    category: PartCategory;
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
    unitPrice: number;
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
  deviceIMEI: string;
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
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  partsUsed?: OrderPartItem[];
  paymentHistory?: PaymentItem[];
}

export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};
