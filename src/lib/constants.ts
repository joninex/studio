import type { OrderStatus, UnlockPatternInfo, Classification, Checklist, User } from '@/types';

export const USER_ROLES = {
  ADMIN: 'admin',
  TECNICO: 'tecnico',
  RECEPCIONISTA: 'recepcionista', // Added new role
} as const;

export const USER_ROLES_VALUES = Object.values(USER_ROLES);


// Updated based on ORDENES.estado
export const ORDER_STATUSES: OrderStatus[] = [
  "ingreso",
  "en diagnóstico",
  "en reparación",
  "esperando pieza",
  "listo para retirar",
  "entregado",
  "abandonado",
  "", // Represents no specific status or a clearable state
];

// Updated based on ORDENES.patron_desbloqueo
export const UNLOCK_PATTERN_OPTIONS: UnlockPatternInfo[] = [
  "tiene",
  "no tiene",
  "no recuerda",
  "no proporciona",
  "", // Represents no selection or clearable state
];

// Updated based on ORDENES.para_stock
export const CLASSIFICATION_OPTIONS: Classification[] = [
  "rojo",
  "verde",
  "sin stock",
  "", // Represents no classification or clearable state
];

// This constant might be deprecated if specificSectors are now individual booleans on the Order type.
// For now, keeping it in case it's used elsewhere, but its direct use in OrderSchema might change.
export const SPECIFIC_SECTORS_OPTIONS: string[] = [
  "Pantallas con daño parcial",
  "Equipos sin clave o que no encienden",
  "Pérdida de información",
];

// Updated based on new CHECKLIST schema field names
export const CHECKLIST_ITEMS: Array<{ id: keyof Checklist; label: string }> = [
  { id: "marca_golpes", label: "Marcas/golpes en carcasa" },
  { id: "cristal_astillado", label: "Cristal de pantalla astillado/roto" },
  { id: "marco_roto", label: "Marco roto/dañado" },
  { id: "tapa_astillada", label: "Tapa trasera astillada/rota" },
  { id: "lente_camara", label: "Lente de cámara (estado físico)" },
  { id: "enciende", label: "Enciende" },
  { id: "tactil_funciona", label: "Táctil funciona" },
  { id: "imagen_pantalla", label: "Imagen en pantalla (correcta)" },
  { id: "botones_funcionales", label: "Botones funcionales (todos)" },
  { id: "camara_trasera", label: "Cámara trasera (funcional)" },
  { id: "camara_delantera", label: "Cámara delantera (funcional)" },
  { id: "vibrador", label: "Vibrador (funcional)" },
  { id: "microfono", label: "Micrófono (funcional)" },
  { id: "auricular", label: "Auricular (funcional)" },
  { id: "parlante", label: "Parlante/Altavoz (funcional)" },
  { id: "sensor_huella", label: "Sensor de huella (funcional)" },
  { id: "senal", label: "Señal (cobertura)" },
  { id: "wifi_bluetooth", label: "WiFi / Bluetooth (funcional)" },
  { id: "pin_carga", label: "Pin de carga (estado/funcional)" },
  { id: "humedad", label: "Indicador de humedad activado" },
];

export const YES_NO_OPTIONS = [
  { label: "Sí", value: "si" },
  { label: "No", value: "no" },
];

export const DEFAULT_STORE_SETTINGS = {
  companyName: "Mi Taller (Default)",
  companyLogoUrl: "https://placehold.co/150x50.png?text=Mi+Taller",
  companyCuit: "",
  companyAddress: "Mi Dirección 123",
  companyContactDetails: "Tel: (011) 1234-5678\nEmail: contacto@mitaller.com",
  branchInfo: "Taller Principal", // This will be the default if user hasn't set their own
  warrantyConditions: "La garantía cubre la reparación por 90 días. No cubre otros daños.",
  pickupConditions: "Retirar dentro de los 30 días. Luego se cobra almacenaje.",
  abandonmentPolicyDays30: 30,
  abandonmentPolicyDays60: 60,
};
