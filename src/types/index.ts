import type { Timestamp } from 'firebase/firestore'; // Using type for Firebase Timestamp

export type UserStatus = 'pending' | 'active' | 'denied';

export type UserRole = 'admin' | 'tecnico' | 'recepcionista';

export interface User {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string; 
  role: UserRole;
  status: UserStatus;
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
  golpe?: 'si' | 'no';
  cristal?: 'si' | 'no';
  marco?: 'si' | 'no';
  tapa?: 'si' | 'no';
  enciende: 'si' | 'no';
  tactil: 'si' | 'no';
  imagen: 'si' | 'no';
  botones?: 'si' | 'no';
  cam_trasera?: 'si' | 'no';
  cam_delantera?: 'si' | 'no';
  vibrador?: 'si' | 'no';
  microfono?: 'si' | 'no';
  auricular?: 'si' | 'no';
  parlante?: 'si' | 'no';
  sensor_huella?: 'si' | 'no';
  senal?: 'si' | 'no';
  wifi_bluetooth?: 'si' | 'no';
  pin_carga?: 'si' | 'no';
  humedad?: 'si' | 'no';
  consumoV?: string;
  mah?: string;
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

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName?: string;
  clientLastName?: string;
  deviceBrand: string;
  deviceModel: string;
  deviceIMEI: string;
  declaredFault: string;
  checklist: Checklist;
  damageRisk?: string;
  costSparePart: number;
  costLabor: number;
  observations?: string;
  status: OrderStatus;
  classification?: Classification | null;
  entryDate: string | Date | Timestamp;
  readyForPickupDate?: string | Date | Timestamp;
  deliveryDate?: string | Date | Timestamp;
  commentsHistory: Comment[];
}

export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};
