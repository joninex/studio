import type { OrderStatus, UnlockPatternInfo, Classification, Checklist } from '@/types';

export const USER_ROLES = {
  ADMIN: 'admin',
  TECNICO: 'tecnico',
} as const;

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
