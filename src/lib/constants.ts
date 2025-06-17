import type { OrderStatus, UnlockPatternInfo, Classification, Checklist, User } from '@/types';

export const USER_ROLES = {
  ADMIN: 'admin',
  TECNICO: 'tecnico',
} as const;

export const USER_ROLES_VALUES = Object.values(USER_ROLES);


export const ORDER_STATUSES: OrderStatus[] = [
  "En diagnóstico",
  "Esperando pieza",
  "Reparado",
  "Listo para Retirar",
  "Entregado",
  "Abandonado",
];

export const UNLOCK_PATTERN_OPTIONS: UnlockPatternInfo[] = [
  "No tiene",
  "No recuerda/sabe",
  "No desea informarla",
];

export const CLASSIFICATION_OPTIONS: Classification[] = [
  "Para stock (rojo)",
  "Para stock (verde)",
];

export const SPECIFIC_SECTORS_OPTIONS: string[] = [
  "Pantallas con daño parcial",
  "Equipos sin clave o que no encienden",
  "Pérdida de información",
];

export const CHECKLIST_ITEMS: Array<{ id: keyof Checklist; label: string }> = [
  { id: "carcasaMarks", label: "Marcas/golpes en carcasa" },
  { id: "screenCrystal", label: "Cristal de pantalla" },
  { id: "frame", label: "Marco" },
  { id: "backCover", label: "Tapa trasera" },
  { id: "camera", label: "Cámara (estado)" },
  { id: "microphone", label: "Micrófono" },
  { id: "speaker", label: "Parlante" },
  { id: "powersOn", label: "Enciende" },
  { id: "touchScreen", label: "Táctil" },
  { id: "deviceCamera", label: "Cámara (funcionalidad)" },
  { id: "fingerprintSensor", label: "Sensor de huella" },
  { id: "signal", label: "Señal" },
  { id: "wifi", label: "WiFi" },
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
  branchInfo: "Taller Principal",
  warrantyConditions: "La garantía cubre la reparación por 90 días. No cubre otros daños.",
  pickupConditions: "Retirar dentro de los 30 días. Luego se cobra almacenaje.",
  abandonmentPolicyDays30: 30,
  abandonmentPolicyDays60: 60,
};
