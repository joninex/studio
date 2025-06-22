import type { OrderStatus, Classification, Checklist, PartCategory, PartUnit, UserRole } from '@/types';

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

export const CLASSIFICATION_OPTIONS: Array<Classification | null> = [
  "rojo",
  "verde",
  "sin stock",
  null,
];

export const CHECKLIST_ITEMS: Array<{ id: keyof Checklist; label: string, type?: 'boolean' | 'text' }> = [
  { id: "golpe", label: "Marcas o golpes", type: 'boolean' },
  { id: "cristal", label: "Cristal astillado/roto", type: 'boolean' },
  { id: "marco", label: "Marco roto/dañado", type: 'boolean' },
  { id: "tapa", label: "Tapa trasera", type: 'boolean' },
  { id: "enciende", label: "Enciende", type: 'boolean' },
  { id: "tactil", label: "Táctil", type: 'boolean' },
  { id: "imagen", label: "Imagen", type: 'boolean' },
  { id: "botones", label: "Botones", type: 'boolean' },
  { id: "cam_trasera", label: "Cámara Trasera", type: 'boolean' },
  { id: "cam_delantera", label: "Cámara Delantera", type: 'boolean' },
  { id: "vibrador", label: "Vibrador", type: 'boolean' },
  { id: "microfono", label: "Micrófono", type: 'boolean' },
  { id: "auricular", label: "Auricular", type: 'boolean' },
  { id: "parlante", label: "Parlante/Altavoz", type: 'boolean' },
  { id: "sensor_huella", label: "Sensor de huella", type: 'boolean' },
  { id: "pin_carga", label: "Pin de Carga", type: 'boolean' },
  { id: "wifi_bluetooth", label: "Wi-Fi / BT", type: 'boolean' },
  { id: "senal", label: "Señal", type: 'boolean' },
  { id: "humedad", label: "Humedad", type: 'boolean' },
  { id: "consumoV", label: "Consumo (V)", type: 'text' },
  { id: "mah", label: "Batería (mAh)", type: 'text' },
];

export const YES_NO_OPTIONS = [
  { label: "Sí", value: "si" },
  { label: "No", value: "no" },
];

export const PART_CATEGORIES: Array<PartCategory | ""> = ["", "Pantalla", "Batería", "Flex", "Cámara", "Placa", "Componente", "Carcasa", "Otro"];
export const PART_UNITS: PartUnit[] = ["unidad", "metro", "kit"];

export const USER_ROLES_VALUES: UserRole[] = ["admin", "tecnico", "recepcionista"];


export const DEFAULT_STORE_SETTINGS = {
    id: 'default_settings',
    companyName: "Mi Taller de Reparación",
    companyLogoUrl: "",
    companyCuit: "",
    companyAddress: "Calle Falsa 123, Ciudad",
    companyContactDetails: "Tel: 123-456-7890 | Email: contacto@mitaller.com",
    branchInfo: "Sucursal Principal",
    unlockDisclaimerText: "IMPORTANTE: Si no se informa el patrón/clave de desbloqueo, el equipo no podrá ser testeado en su totalidad. El presupuesto y la reparación quedarán limitados a la falla reportada. La empresa no se hace responsable por fallas secundarias no detectadas.",
    abandonmentPolicyText: "POLÍTICA DE ABANDONO: Pasados los 30 días corridos desde la fecha de notificación para retirar el equipo, se cobrará un recargo diario por depósito. Pasados los 60 días, la empresa podrá disponer del equipo para cubrir los costos de reparación y almacenamiento según el Art. 2525 y 2526 del C.C. y C.",
    abandonmentPolicyDays30: 30,
    abandonmentPolicyDays60: 60,
    dataLossPolicyText: "PÉRDIDA DE INFORMACIÓN: La empresa NO se responsabiliza por la pérdida total o parcial de información (contactos, fotos, software, etc.) del equipo. Es responsabilidad del cliente realizar una copia de seguridad antes de entregar el equipo para su reparación.",
    untestedDevicePolicyText: "EQUIPOS SIN ENCENDER/SIN CLAVE: El diagnóstico se basará en la falla reportada. Cualquier otra falla no podrá ser detectada hasta que el equipo encienda o se pueda acceder a él, pudiendo generar costos adicionales que serán informados para su aprobación.",
    budgetVariationText: "VARIACIÓN DE PRESUPUESTO: El presupuesto informado es una estimación. Si durante la reparación surgieran fallas no detectadas que impliquen un costo adicional, se notificará al cliente para su aprobación antes de continuar.",
    highRiskDeviceText: "EQUIPOS CON RIESGOS ESPECIALES (Mojados, sulfatados, golpes severos): Estos equipos pueden presentar fallas impredecibles durante o después de la reparación. El cliente asume el riesgo de que el equipo pueda no volver a encender o presentar nuevas fallas.",
    partialDamageDisplayText: "PANTALLAS CON DAÑO PARCIAL: En equipos con pantallas parcialmente funcionales (daño de cristal pero con imagen), existe el riesgo de que la pantalla deje de funcionar por completo durante el desarme. El cliente acepta este riesgo al autorizar la reparación.",
    warrantyVoidConditionsText: "ANULACIÓN DE GARANTÍA: La garantía quedará anulada si el equipo es abierto o intervenido por terceros, presenta golpes, humedad, fallas de software o daños no relacionados con la reparación original. La garantía cubre exclusivamente la pieza reemplazada y la mano de obra asociada.",
    privacyPolicyText: "POLÍTICA DE PRIVACIDAD: El cliente autoriza a la empresa a acceder a la información del dispositivo con el único fin de realizar el diagnóstico y la reparación. Sus datos no serán compartidos con terceros.",
    warrantyConditions: "La garantía sobre la reparación es de 90 días a partir de la fecha de entrega y cubre únicamente el trabajo realizado y las piezas reemplazadas.",
    pickupConditions: "Para retirar el equipo es indispensable presentar este comprobante. Pasados los 30 días, se aplicará un costo de almacenamiento.",
};
