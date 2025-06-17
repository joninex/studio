import type { OrderStatus, Classification, Checklist, UserRole, WarrantyType } from '@/types';

export const USER_ROLES = {
  ADMIN: 'admin',
  TECNICO: 'tecnico',
  RECEPCIONISTA: 'recepcionista',
} as const;

export const USER_ROLES_VALUES = Object.values(USER_ROLES) as [UserRole, ...UserRole[]];


export const ORDER_STATUSES: Array<OrderStatus | ""> = [
  "Recibido",
  "En Diagnóstico",
  "Presupuestado",
  "Presupuesto Aprobado",
  "En Espera de Repuestos",
  "En Reparación",
  "Reparado",
  "En Control de Calidad",
  "Listo para Entrega",
  "Entregado",
  "Presupuesto Rechazado",
  "Sin Reparación",
  "", 
];

// This constant is no longer directly used for the OrderForm select,
// as unlockPatternInfo is now a string input. It can be kept for reference or other UI uses if needed.
export const UNLOCK_PATTERN_INFO_SUGGESTIONS: string[] = [
  "No tiene",
  "No recuerda",
  "No proporciona",
  "Cliente proveyó patrón/clave",
];

export const CLASSIFICATION_OPTIONS: Classification[] = [
  "rojo",
  "verde",
  "sin stock",
  "",
];

export const SPECIFIC_SECTORS_OPTIONS: string[] = [
  "Pantallas con daño parcial",
  "Equipos sin clave o que no encienden",
  "Pérdida de información",
];

export const CHECKLIST_ITEMS: Array<{ id: keyof Checklist; label: string }> = [
  { id: "golpe", label: "Marcas/golpes en carcasa" },
  { id: "cristal", label: "Cristal de pantalla astillado/roto" },
  { id: "marco", label: "Marco roto/dañado" },
  { id: "tapa", label: "Tapa trasera astillada/rota" },
  { id: "lente_camara", label: "Lente de cámara (estado físico)" },
  { id: "enciende", label: "Enciende" },
  { id: "tactil", label: "Táctil funciona" },
  { id: "imagen", label: "Imagen en pantalla (correcta)" },
  { id: "botones", label: "Botones funcionales (todos)" },
  { id: "cam_trasera", label: "Cámara trasera (funcional)" },
  { id: "cam_delantera", label: "Cámara delantera (funcional)" },
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

export const WARRANTY_TYPES: WarrantyType[] = ['30d', '60d', '90d', 'custom', ''];

export const WARRANTY_TYPE_OPTIONS: Array<{ value: WarrantyType; label: string }> = [
  { value: "30d", label: "30 Días" },
  { value: "60d", label: "60 Días" },
  { value: "90d", label: "90 Días" },
  { value: "custom", label: "Personalizado" },
];


export const DEFAULT_STORE_SETTINGS = {
  companyName: "Mi Taller (Default)",
  companyLogoUrl: "https://placehold.co/150x50.png?text=Mi+Taller",
  companyCuit: "",
  companyAddress: "Mi Dirección 123",
  companyContactDetails: "Tel: (011) 1234-5678\nEmail: contacto@mitaller.com",
  branchInfo: "Taller Principal",
  warrantyConditions: "La garantía cubre la reparación por 90 días. No cubre otros daños.",
  pickupConditions: "Retirar dentro de los 30 días. Luego se cobra almacenaje.",
  abandonmentPolicyDays30: 30,
  abandonmentPolicyDays60: 60,
  dataLossDisclaimerText: "El cliente comprende y acepta que durante el proceso de diagnóstico y/o reparación existe el riesgo de pérdida total o parcial de la información almacenada en el dispositivo. Se recomienda realizar una copia de seguridad previa. El taller no se responsabiliza por la pérdida de datos.",
  privacyPolicyText: "El cliente autoriza al taller a acceder a la información del dispositivo necesaria para realizar el diagnóstico y/o reparación. Los datos personales y la información del dispositivo serán tratados con confidencialidad y solo para los fines del servicio.",
};
