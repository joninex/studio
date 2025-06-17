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

export const UNLOCK_PATTERN_INFO_SUGGESTIONS: string[] = [
  "No tiene",
  "No recuerda / sabe",
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

export const CHECKLIST_ITEMS: Array<{ id: keyof Checklist; label: string, type?: 'boolean' | 'text' | 'enum_saleConHuella' }> = [
  { id: "golpe", label: "Marcas o golpes en carcasa", type: 'boolean' },
  { id: "cristal", label: "Cristal astillado/roto", type: 'boolean' },
  { id: "marco", label: "Marco roto/dañado", type: 'boolean' },
  { id: "equipo_doblado", label: "Equipo doblado", type: 'boolean'},
  { id: "tapa", label: "Tapa trasera astillada/rota", type: 'boolean' },
  { id: "lente_camara", label: "Lente de cámara OK", type: 'boolean' },
  { id: "enciende", label: "Enciende", type: 'boolean' },
  { id: "tactil", label: "Táctil funcionando", type: 'boolean' },
  { id: "imagen", label: "Emite imagen", type: 'boolean' },
  { id: "botones", label: "Botones funcionales", type: 'boolean' },
  { id: "cam_trasera", label: "Cámara trasera", type: 'boolean' },
  { id: "cam_delantera", label: "Cámara delantera", type: 'boolean' },
  { id: "vibrador", label: "Vibrador", type: 'boolean' },
  { id: "microfono", label: "Micrófono", type: 'boolean' },
  { id: "auricular", label: "Auricular", type: 'boolean' },
  { id: "parlante", label: "Parlante/Altavoz", type: 'boolean' },
  { id: "sensor_huella", label: "Sensor de huella funcional", type: 'boolean' },
  { id: "senal", label: "Señal funcional", type: 'boolean' },
  { id: "wifi_bluetooth", label: "WiFi/BT", type: 'boolean' },
  { id: "pin_carga", label: "Pin de carga en buen estado", type: 'boolean' },
  { id: "humedad", label: "Signos de humedad", type: 'boolean' },
  { id: "consumoV", label: "Consumo V:", type: 'text' },
  { id: "mah", label: "mAh:", type: 'text' },
  { id: "saleConHuella", label: "Sale con huella", type: 'enum_saleConHuella' },
];

export const YES_NO_OPTIONS = [
  { label: "Sí", value: "si" },
  { label: "No", value: "no" },
];

export const SALE_CON_HUELLA_OPTIONS = [
  { label: "Sí", value: "si" },
  { label: "No", value: "no" },
  { label: "No tiene", value: "no_tiene" },
];


export const WARRANTY_TYPES: WarrantyType[] = ['30d', '60d', '90d', 'custom']; // Removed ""

export const WARRANTY_TYPE_OPTIONS: Array<{ value: WarrantyType; label: string }> = [
  { value: "30d", label: "30 Días" },
  { value: "60d", label: "60 Días" },
  { value: "90d", label: "90 Días" },
  { value: "custom", label: "Personalizado" },
];


export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  companyName: "Mi Taller (TecnoLand Ejemplo)",
  companyLogoUrl: "https://placehold.co/150x70.png?text=TU+LOGO",
  companyCuit: "XX-XXXXXXXX-X",
  companyAddress: "La Rioja 1799-1699, N3301 Posadas, Misiones (Ejemplo)",
  companyContactDetails: "Tel/WhatsApp: 11 3016-5093 (Ejemplo)\nEmail: contacto@mitaller.com",
  branchInfo: "Taller Principal",
  
  warrantyConditions: "CONDICIONES GENERALES DE GARANTÍA: TecnoLand garantiza la reparación por noventa (90) días calendario a partir de la fecha de entrega, únicamente sobre la/s falla/s especificada/s en la presente orden y sobre el/los repuesto/s utilizado/s si los hubiere. La garantía podrá ser anulada si se detecta dolo o fraude por parte del cliente o terceros.",
  pickupConditions: "CONDICIONES GENERALES DE RETIRO: El cliente deberá retirar el equipo dentro de los plazos establecidos. Consultar políticas de abandono.",
  
  abandonmentPolicyDays30: 30,
  abandonmentPolicyDays60: 60,
  
  // More specific legal texts
  unlockDisclaimerText: "IMPORTANTE (DESBLOQUEO): Si no se informa el patrón/clave de desbloqueo o si el informado es incorrecto, es imposible realizar un test de funcionalidad completo del equipo. TecnoLand NO será responsable de los componentes no testeados. La garantía será únicamente por el repuesto utilizado si no se pueden verificar las funciones del equipo.",
  abandonmentPolicyText: "POLÍTICA DE ABANDONO DE EQUIPO: Pasados los 30 (treinta) días de la notificación de equipo 'LISTO PARA RETIRAR' o 'PRESUPUESTADO', el valor de la reparación o presupuesto se actualizará según la inflación vigente. Pasados los 60 (sesenta) días corridos desde dicha notificación sin que el equipo sea retirado, se considerará en estado de abandono según Art. 2525 y 2526 CCCN, facultando a TecnoLand a disponer del mismo para cubrir gastos, sin derecho a reclamo por parte del cliente.",
  dataLossPolicyText: "PÉRDIDA DE INFORMACIÓN Y POLÍTICA DE PRIVACIDAD: TecnoLand NO se responsabiliza por la pérdida total o parcial de información (contactos, fotos, videos, etc.) alojada en el equipo. Es responsabilidad del cliente realizar un backup previo. El cliente puede solicitar un servicio de backup con costo adicional. El cliente autoriza al taller a acceder a la información del dispositivo necesaria para realizar el diagnóstico y/o reparación. Los datos personales y la información del dispositivo serán tratados con confidencialidad y solo para los fines del servicio.",
  untestedDevicePolicyText: "EQUIPOS SIN ENCENDER O CON CLAVE/PATRÓN NO INFORMADO: Estos equipos se entregan sin el testeo completo de funcionalidad. La garantía será sobre el repuesto o la falla informada. Para hacer efectiva la garantía en caso de reingreso, el cliente deberá informar el patrón o clave de desbloqueo.",
  budgetVariationText: "PRESUPUESTO: El presupuesto informado se basa en la falla declarada por el cliente y/o en la revisión inicial. Si durante la reparación se detectan fallas adicionales no contempladas, se informará al cliente un nuevo presupuesto. Si no es aceptado, se cobrará el valor del diagnóstico inicial si correspondiera.",
  highRiskDeviceText: "TELÉFONOS CON RIESGOS ESPECIALES: Equipos mojados, sulfatados, con golpes fuertes, intervenidos previamente por terceros o con problemas de placa madre pueden presentar riesgos adicionales durante el desarme o reparación, pudiendo dejar de funcionar o agravar su estado. El cliente acepta estos riesgos. TecnoLand ofrecerá opciones si el equipo se ve afectado.",
  partialDamageDisplayText: "PANTALLAS CON DAÑO PARCIAL: En equipos con pantallas parcialmente funcionales (ej. imagen con manchas, líneas, táctil fallando en sectores), la falla puede incrementarse o dejar de funcionar por completo durante el desarme. TecnoLand no se responsabiliza por dicho agravamiento. Si el cliente decide retirar el equipo sin reparación, se devolverá con la pantalla original en el estado en que se encuentre tras el intento de reparación.",
  warrantyVoidConditionsText: "ANULACIÓN DE GARANTÍA: La garantía quedará anulada por: Excesos o picos de tensión eléctrica; ingreso de humedad o líquidos; intervención de terceros no autorizados; uso inadecuado o negligente; golpes, caídas o roturas posteriores a la reparación; uso de cargadores no originales o defectuosos; instalación de software no autorizado, virus o malware; deformaciones estéticas o daños no relacionados con la reparación original. EQUIPOS REPARADOS POR HUMEDAD, SOFTWARE O CORTOS ELÉCTRICOS cuentan con una garantía de 72 horas únicamente sobre la falla reparada.",
  privacyPolicyText: "POLÍTICA DE PRIVACIDAD ADICIONAL: [El administrador puede agregar aquí texto adicional sobre privacidad si es necesario, complementando lo indicado en la política de pérdida de datos.]", // Kept separate for more flexibility if needed
};
