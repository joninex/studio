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
  status: UserStatus; // Corresponds to activo ('si'/'no' logic handled in actions/UI)
  storeSettings?: StoreSettings;
  createdAt: Timestamp | Date | string; // Corresponds to fecha_creacion
  updatedAt: Timestamp | Date | string;
}

export interface Client { // New entity based on CLIENTES schema
  id: string; // Corresponds to id_cliente
  name: string; // Corresponds to nombre
  dni: string; // Corresponds to DNI
  phone: string; // Corresponds to telefono
  email?: string; // Corresponds to email
  address?: string; // Corresponds to direccion
  notes?: string; // Corresponds to notas (observaciones)
  // Assuming we'll add createdAt, updatedAt for clients too
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

export interface Checklist {
  // Updated field names based on CHECKLIST schema, keeping 'si'/'no' for now
  marca_golpes: 'si' | 'no';
  cristal_astillado: 'si' | 'no';
  marco_roto: 'si' | 'no';
  tapa_astillada: 'si' | 'no';
  lente_camara: 'si' | 'no'; // Estado del lente, no funcionalidad
  enciende: 'si' | 'no';
  tactil_funciona: 'si' | 'no';
  imagen_pantalla: 'si' | 'no'; // Si da imagen correctamente
  botones_funcionales: 'si' | 'no';
  camara_trasera: 'si' | 'no'; // Funcionalidad cámara trasera
  camara_delantera: 'si' | 'no'; // Funcionalidad cámara delantera
  vibrador: 'si' | 'no';
  microfono: 'si' | 'no'; // Funcionalidad micrófono
  auricular: 'si' | 'no'; // Funcionalidad auricular (llamadas)
  parlante: 'si' | 'no'; // Funcionalidad parlante (altavoz)
  sensor_huella: 'si' | 'no';
  senal: 'si' | 'no';
  wifi_bluetooth: 'si' | 'no';
  pin_carga: 'si' | 'no';
  humedad: 'si' | 'no';
}

// Updated based on ORDENES.patron_desbloqueo
export type UnlockPatternInfo = "tiene" | "no tiene" | "no recuerda" | "no proporciona" | "";

// Updated based on ORDENES.para_stock
export type Classification = "rojo" | "verde" | "sin stock" | "";

// Updated based on ORDENES.estado
export type OrderStatus =
  | "ingreso"
  | "en diagnóstico"
  | "en reparación"
  | "esperando pieza"
  | "listo para retirar"
  | "entregado"
  | "abandonado"
  | "";

export interface Comment { // Based on COMENTARIOS o NOTAS ADICIONALES
  id?: string; // Corresponds to id_comentario
  // id_orden will be implicit by being part of Order.commentsHistory for now
  userId: string; // Corresponds to id_usuario (link USUARIOS)
  description: string; // Corresponds to descripcion
  timestamp: Timestamp | Date | string; // Corresponds to fecha
  // Current 'user' (name) field can be derived from userId if needed for display
  userName?: string; // For display purposes
}

export interface Order {
  id?: string; // Corresponds to id_orden
  orderNumber: string; // Corresponds to numero_orden

  clientId: string; // New: link to CLIENTES (id_cliente)
  createdByUserId: string; // Corresponds to id_usuario_creacion

  deviceBrand: string; // Corresponds to marca
  deviceModel: string; // Corresponds to modelo
  deviceIMEI: string; // Corresponds to IMEI o Serial
  declaredFault: string; // Corresponds to falla_reportada
  unlockPatternInfo: UnlockPatternInfo; // Updated enum

  damageRisk?: string; // Corresponds to riesgo_rotura
  // New boolean fields from ORDENES schema
  pantalla_parcial?: boolean;
  equipo_sin_acceso?: boolean;
  perdida_informacion?: boolean;

  classification: Classification; // Updated enum, corresponds to para_stock
  observations?: string; // Corresponds to observaciones (generales de la orden)

  status: OrderStatus; // Updated enum
  previousOrderId?: string;

  entryDate: Timestamp | Date | string; // Corresponds to fecha_ingreso
  deliveryDate?: Timestamp | Date | string | null; // Corresponds to fecha_salida

  commentsHistory: Comment[]; // Array of comments, to be potentially refactored to separate table later

  checklist: Checklist; // Checklist object associated with the order

  // Store snapshot fields for printing - these remain important
  orderCompanyName?: string;
  orderCompanyLogoUrl?: string;
  orderCompanyCuit?: string;
  orderCompanyAddress?: string;
  orderCompanyContactDetails?: string;
  orderWarrantyConditions?: string;
  orderPickupConditions?: string;
  orderAbandonmentPolicyDays60?: number;

  // Cost fields - these are more aligned with DIAGNOSTICOS but often part of Order summary
  costSparePart: number;
  costLabor: number;
  costPending: number;

  // Timestamps and user tracking
  lastUpdatedBy: string; // User ID
  updatedAt: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;

  // Fields for customer acceptance - consider if this moves to FIRMAS
  customerAccepted?: boolean;
  customerSignatureName?: string;
}

// For AI suggestion - remains unchanged for now
export type AISuggestion = {
  possibleCauses: string;
  suggestedSolutions: string;
};

// Deprecated, use StoreSettings instead if needed for global fallbacks,
// but primary settings are now per-user.
export interface Configurations extends StoreSettings {}
