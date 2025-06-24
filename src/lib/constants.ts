import type { OrderStatus, Classification, Checklist, PartCategory, PartUnit, UserRole, FiscalCondition } from '@/types';

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

// Re-structured checklist based on user's legal and logical grouping
export const CHECKLIST_ITEMS: Array<{ id: keyof Checklist; label: string, group: string, type?: 'boolean' | 'text' }> = [
  // Estado Físico
  { id: "golpes_marcas", label: "Golpes o marcas visibles", group: "Estado Físico", type: 'boolean' },
  { id: "cristal_roto", label: "Cristal astillado o roto", group: "Estado Físico", type: 'boolean' },
  { id: "marco_doblado", label: "Marco doblado o dañado", group: "Estado Físico", type: 'boolean' },
  { id: "tapa_trasera", label: "Tapa trasera rota o floja", group: "Estado Físico", type: 'boolean' },
  { id: "signos_humedad", label: "Indicadores de humedad activos", group: "Estado Físico", type: 'boolean' },

  // Encendido y Energía
  { id: "enciende", label: "Equipo Enciende", group: "Encendido y Energía", type: 'boolean' },
  { id: "consumo_voltaje", label: "Consumo Voltaje (V)", group: "Encendido y Energía", type: 'text' },
  { id: "bateria_mah", label: "Batería Carga (mAh)", group: "Encendido y Energía", type: 'text' },

  // Pantalla y Controles
  { id: "imagen_pantalla", label: "Imagen en pantalla", group: "Pantalla y Controles", type: 'boolean' },
  { id: "respuesta_tactil", label: "Respuesta táctil", group: "Pantalla y Controles", type: 'boolean' },
  { id: "botones_fisicos", label: "Botones físicos", group: "Pantalla y Controles", type: 'boolean' },
  { id: "sensor_huella_faceid", label: "Sensor Huella / Face ID", group: "Pantalla y Controles", type: 'boolean' },
  
  // Audio y Comunicaciones
  { id: "auricular_llamadas", label: "Auricular (Llamadas)", group: "Audio y Comunicaciones", type: 'boolean' },
  { id: "altavoz_multimedia", label: "Altavoz (Multimedia)", group: "Audio y Comunicaciones", type: 'boolean' },
  { id: "microfono", label: "Micrófono", group: "Audio y Comunicaciones", type: 'boolean' },
  { id: "vibrador", label: "Vibrador", group: "Audio y Comunicaciones", type: 'boolean' },

  // Cámaras
  { id: "camara_trasera", label: "Cámara trasera", group: "Cámaras", type: 'boolean' },
  { id: "camara_delantera", label: "Cámara delantera", group: "Cámaras", type: 'boolean' },
  
  // Conectividad y Carga
  { id: "puerto_carga", label: "Puerto de carga", group: "Conectividad y Carga", type: 'boolean' },
  { id: "wifi_bluetooth", label: "Conexión Wi-Fi / Bluetooth", group: "Conectividad y Carga", type: 'boolean' },
  { id: "senal_red_movil", label: "Señal de red móvil (SIM)", group: "Conectividad y Carga", type: 'boolean' },
];

export const YES_NO_OPTIONS = [
  { label: "Sí", value: "si" },
  { label: "No", value: "no" },
  { label: "S/C", value: "sc" },
];

export const LEGAL_TEXTS = {
  checklistDisclaimer: "Diagnóstico inicial no invasivo. El estado de componentes no comprobados se definirá en una etapa posterior.",
  noUnlockCodeDisclaimer: "El cliente no ha dejado el código de desbloqueo. Por esta razón, no se han podido comprobar ciertas funciones del equipo. Acepta que la empresa solo se responsabiliza por el componente intervenido y no por otras funciones no verificadas."
};


export const PART_CATEGORIES: PartCategory[] = ["Pantalla", "Batería", "Flex", "Cámara", "Placa", "Componente", "Carcasa", "Otro"];
export const PART_UNITS: PartUnit[] = ["unidad", "metro", "kit"];

export const USER_ROLES_VALUES: UserRole[] = ["admin", "tecnico", "recepcionista"];

export const FISCAL_CONDITIONS: FiscalCondition[] = ["Consumidor Final", "Monotributista", "Responsable Inscripto", "Exento"];


export const DEFAULT_STORE_SETTINGS = {
    id: 'default_settings',
    companyName: "Mi Taller de Reparación",
    companyLogoUrl: "",
    companyCuit: "",
    companyAddress: "Calle Falsa 123, Ciudad",
    companyContactDetails: "Tel: 123-456-7890 | Email: contacto@mitaller.com",
    branchInfo: "Sucursal Principal",
    // Consolidated legal text for the workshop copy
    intakeConformityText: "El cliente declara que los datos y el estado del equipo detallados en este documento son fieles a la condición del mismo al momento de su entrega. Acepta que esta revisión es de carácter externo y no invasivo, realizada sin la apertura del equipo. Si no se proporcionó un código de desbloqueo, el cliente comprende y acepta que los componentes que requieren acceso al sistema no pudieron ser evaluados y, por lo tanto, la responsabilidad del servicio técnico se limita exclusivamente al componente a reparar o reemplazar según el diagnóstico final. La empresa no se responsabiliza por fallas o vicios ocultos no diagnosticados en esta etapa inicial. En caso de no aceptar el presupuesto final, el equipo podrá ser retirado sin costo de revisión. El cliente confirma haber leído y aceptado las condiciones generales del servicio.",
    // Simplified legal reminder for the customer's voucher
    clientVoucherLegalReminder: "Para retirar el equipo es indispensable presentar este comprobante y documento de identidad del titular. La empresa no se responsabiliza por accesorios no declarados en el ingreso. La garantía de 90 días cubre exclusivamente el trabajo y los repuestos detallados en la reparación final.",
    noUnlockCodeDisclaimer: "IMPORTANTE: Si no se informa el patrón/clave de desbloqueo, el equipo no podrá ser testeado en su totalidad. El presupuesto y la reparación quedarán limitados a la falla reportada. La empresa no se hace responsable por fallas secundarias no detectadas.",
    unlockDisclaimerText: "IMPORTANTE: Si no se informa el patrón/clave de desbloqueo, el equipo no podrá ser testeado en su totalidad. El presupuesto y la reparación quedarán limitados a la falla reportada. La empresa no se hace responsable por fallas secundarias no detectadas.",
    abandonmentPolicyText: "POLÍTICA DE ABANDONO: Pasados los 30 días corridos desde la fecha de notificación para retirar el equipo, se cobrará un recargo diario por depósito. Pasados los 60 días, la empresa podrá disponer del equipo para cubrir los costos de reparación y almacenamiento según el Art. 2525 y 2526 del C.C. y C.",
    abandonmentPolicyDays30: 30,
    abandonmentPolicyDays60: 60,
    dataLossPolicyText: "PÉRDIDA DE INFORMACIÓN: La empresa NO se responsabiliza por la pérdida total o parcial de información (contactos, fotos, software, etc.) del equipo. Es responsabilidad del cliente realizar una copia de seguridad antes de entregar el equipo para su reparación.",
    untestedDevicePolicyText: "EQUIPOS SIN ENCENDER O CON CLAVE/PATRÓN NO INFORMADO: El diagnóstico se basará en la falla reportada. Cualquier otra falla no podrá ser detectada hasta que el equipo encienda o se pueda acceder a él, pudiendo generar costos adicionales que serán informados para su aprobación.",
    budgetVariationText: "VARIACIÓN DE PRESUPUESTO: El presupuesto informado es una estimación. Si durante la reparación surgieran fallas no detectadas que impliquen un costo adicional, se notificará al cliente para su aprobación antes de continuar.",
    highRiskDeviceText: "EQUIPOS CON RIESGOS ESPECIALES (Mojados, sulfatados, golpes severos): Estos equipos pueden presentar fallas impredecibles durante o después de la reparación. El cliente asume el riesgo de que el equipo pueda no volver a encender o presentar nuevas fallas.",
    partialDamageDisplayText: "PANTALLAS CON DAÑO PARCIAL: En equipos con pantallas parcialmente funcionales (daño de cristal pero con imagen), existe el riesgo de que la pantalla deje de funcionar por completo durante el desarme. El cliente acepta este riesgo al autorizar la reparación.",
    warrantyVoidConditionsText: "ANULACIÓN DE GARANTÍA: La garantía quedará anulada si el equipo es abierto o intervenido por terceros, presenta golpes, humedad, fallas de software o daños no relacionados con la reparación original. La garantía cubre exclusivamente la pieza reemplazada y la mano de obra asociada.",
    privacyPolicyText: "POLÍTICA DE PRIVACIDAD: El cliente autoriza a la empresa a acceder a la información del dispositivo con el único fin de realizar el diagnóstico y la reparación. Sus datos no serán compartidos con terceros.",
    warrantyConditions: "La garantía sobre la reparación es de 90 días a partir de la fecha de entrega y cubre únicamente el trabajo realizado y las piezas reemplazadas.",
    pickupConditions: "Para retirar el equipo es indispensable presentar este comprobante. Pasados los 30 días, se aplicará un costo de almacenamiento.",
};
