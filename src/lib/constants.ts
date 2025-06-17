
import type { OrderStatus, Classification, Checklist, UserRole, WarrantyType, StoreSettings } from '@/types';

export const USER_ROLES = {
  ADMIN: 'admin',
  TECNICO: 'tecnico',
  RECEPCIONISTA: 'recepcionista',
  CADETE: 'cadete',
  PROVEEDOR_EXTERNO: 'proveedor_externo',
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


export const CLASSIFICATION_OPTIONS: Array<Classification | null> = [
  "rojo",
  "verde",
  "sin stock",
  null,
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


export const WARRANTY_TYPES: Array<WarrantyType> = ['30d', '60d', '90d', 'custom', null];

export const WARRANTY_TYPE_OPTIONS: Array<{ value: Exclude<WarrantyType, null | ''>; label: string }> = [
  { value: "30d", label: "30 Días" },
  { value: "60d", label: "60 Días" },
  { value: "90d", label: "90 Días" },
  { value: "custom", label: "Personalizado (definir fecha fin)" },
];


export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  companyName: "JO-SERVICE",
  companyLogoUrl: "https://placehold.co/150x50.png?text=Logo",
  companyCuit: "XX-XXXXXXXX-X",
  companyAddress: "Dirección Ejemplo 123, Ciudad",
  companyContactDetails: "Tel: (123) 456-7890\nEmail: contacto@joservice.com",
  branchInfo: "Taller Principal",

  warrantyConditions: "CONDICIONES GENERALES DE GARANTÍA: JO-SERVICE garantiza la reparación por noventa (90) días calendario (o el período especificado) a partir de la fecha de entrega, únicamente sobre la/s falla/s especificada/s en la presente orden y sobre el/los repuesto/s utilizado/s si los hubiere. La garantía podrá ser anulada si se detecta dolo o fraude por parte del cliente o terceros.",
  pickupConditions: "CONDICIONES GENERALES DE RETIRO: El cliente deberá retirar el equipo dentro de los plazos establecidos. Consultar políticas de abandono. El equipo se entrega al portador del comprobante con datos coincidentes. Si lo retira un tercero, se requiere autorización escrita y copia del DNI del titular.",

  abandonmentPolicyDays30: 30,
  abandonmentPolicyDays60: 60,

  unlockDisclaimerText: "IMPORTANTE (DESBLOQUEO): Si no se informa el patrón/clave de desbloqueo o si el informado es incorrecto, es imposible realizar un test de funcionalidad completo del equipo. JO-SERVICE NO será responsable de los componentes no testeados. La garantía será únicamente por el repuesto utilizado si no se pueden verificar las funciones del equipo.",
  abandonmentPolicyText: "POLÍTICA DE ABANDONO DE EQUIPO: Pasados los treinta (30) días de la notificación de equipo 'LISTO PARA RETIRAR' o 'PRESUPUESTADO', el valor de la reparación o presupuesto se actualizará según la inflación vigente. Pasados los sesenta (60) días corridos desde dicha notificación sin que el equipo sea retirado, se considerará en estado de abandono según Art. 2525 y 2526 CCCN, facultando a JO-SERVICE a disponer del mismo para cubrir gastos, sin derecho a reclamo por parte del cliente.",
  dataLossPolicyText: "PÉRDIDA DE INFORMACIÓN Y POLÍTICA DE PRIVACIDAD: JO-SERVICE NO se responsabiliza por la pérdida total o parcial de información (contactos, fotos, videos, etc.) alojada en el equipo. Es responsabilidad del cliente realizar un backup previo. El cliente puede solicitar un servicio de backup con costo adicional. El cliente autoriza al taller a acceder a la información del dispositivo necesaria para realizar el diagnóstico y/o reparación. Los datos personales y la información del dispositivo serán tratados con confidencialidad y solo para los fines del servicio.",
  untestedDevicePolicyText: "EQUIPOS SIN ENCENDER O CON CLAVE/PATRÓN NO INFORMADO: Estos equipos se entregan sin el testeo completo de funcionalidad. La garantía será sobre el repuesto o la falla informada. Para hacer efectiva la garantía en caso de reingreso, el cliente deberá informar el patrón o clave de desbloqueo.",
  budgetVariationText: "PRESUPUESTO: El presupuesto informado se basa en la falla declarada por el cliente y/o en la revisión inicial. Si durante la reparación se detectan fallas adicionales no contempladas, se informará al cliente un nuevo presupuesto. Si no es aceptado, se cobrará el valor del diagnóstico inicial si correspondiera.",
  highRiskDeviceText: "TELÉFONOS CON RIESGOS ESPECIALES: Equipos mojados, sulfatados, con golpes fuertes, intervenidos previamente por terceros o con problemas de placa madre pueden presentar riesgos adicionales durante el desarme o reparación, pudiendo dejar de funcionar o agravar su estado. El cliente acepta estos riesgos. JO-SERVICE ofrecerá opciones si el equipo se ve afectado.",
  partialDamageDisplayText: "PANTALLAS CON DAÑO PARCIAL: En equipos con pantallas parcialmente funcionales (ej. imagen con manchas, líneas, táctil fallando en sectores), la falla puede incrementarse o dejar de funcionar por completo durante el desarme. JO-SERVICE no se responsabiliza por dicho agravamiento. Si el cliente decide retirar el equipo sin reparación, se devolverá con la pantalla original en el estado en que se encuentre tras el intento de reparación.",
  warrantyVoidConditionsText: "ANULACIÓN DE GARANTÍA: La garantía quedará anulada por: Excesos o picos de tensión eléctrica; ingreso de humedad o líquidos; intervención de terceros no autorizados; uso inadecuado o negligente; golpes, caídas o roturas posteriores a la reparación; uso de cargadores no originales o defectuosos; instalación de software no autorizado, virus o malware; deformaciones estéticas o daños no relacionados con la reparación original. Equipos reparados por humedad, software o cortos eléctricos cuentan con una garantía limitada de 72 horas únicamente sobre la falla reparada, salvo que se especifique una garantía extendida por escrito en esta orden.",
  privacyPolicyText: "POLÍTICA DE PRIVACIDAD ADICIONAL: [El administrador puede agregar aquí texto adicional sobre privacidad si es necesario, complementando lo indicado en la política de pérdida de datos. Ejemplo: Uso de datos para envío de encuestas de satisfacción o promociones.]",
};


// DEVICE LISTINGS
export const DEVICE_CATEGORIES = {
  MOBILE: "Móvil",
  TABLET: "Tablet",
  NOTEBOOK: "Notebook",
  CONSOLE: "Consola de Videojuegos",
  // ALLINONE: "All-in-One PC",
  // DESKTOP: "PC de Escritorio",
  // SMARTWATCH: "Smartwatch",
  // OTHER: "Otro",
} as const;

export type DeviceCategoryKey = keyof typeof DEVICE_CATEGORIES;
export type DeviceCategoryValue = typeof DEVICE_CATEGORIES[DeviceCategoryKey];

export interface DeviceModelInfo {
  name: string;
  // commonIssues?: string[]; // Example of future expansion
}

export interface DeviceBrandInfo {
  name: string;
  models: DeviceModelInfo[];
}

export type DeviceCollection = {
  [key in DeviceCategoryKey]?: DeviceBrandInfo[];
};

export const DEVICE_LIST: DeviceCollection = {
  MOBILE: [
    {
      name: "Samsung",
      models: [
        { name: "Galaxy S24 Ultra" }, { name: "Galaxy S24+" }, { name: "Galaxy S24" },
        { name: "Galaxy S23 Ultra" }, { name: "Galaxy S23+" }, { name: "Galaxy S23" }, { name: "Galaxy S23 FE" },
        { name: "Galaxy S22 Ultra" }, { name: "Galaxy S22+" }, { name: "Galaxy S22" },
        { name: "Galaxy S21 Ultra" }, { name: "Galaxy S21+" }, { name: "Galaxy S21" }, { name: "Galaxy S21 FE" },
        { name: "Galaxy S20 Ultra" }, { name: "Galaxy S20+" }, { name: "Galaxy S20" }, { name: "Galaxy S20 FE" },
        { name: "Galaxy Z Fold 5" }, { name: "Galaxy Z Flip 5" },
        { name: "Galaxy Z Fold 4" }, { name: "Galaxy Z Flip 4" },
        { name: "Galaxy A55" }, { name: "Galaxy A35" }, { name: "Galaxy A25" }, { name: "Galaxy A15" },
        { name: "Galaxy A54" }, { name: "Galaxy A34" }, { name: "Galaxy A24" }, { name: "Galaxy A14" },
        { name: "Galaxy M54" }, { name: "Galaxy M34" }, { name: "Galaxy M14" },
        { name: "Galaxy Note 20 Ultra" }, { name: "Galaxy Note 20" },
      ],
    },
    {
      name: "Apple",
      models: [
        { name: "iPhone 15 Pro Max" }, { name: "iPhone 15 Pro" }, { name: "iPhone 15 Plus" }, { name: "iPhone 15" },
        { name: "iPhone 14 Pro Max" }, { name: "iPhone 14 Pro" }, { name: "iPhone 14 Plus" }, { name: "iPhone 14" },
        { name: "iPhone 13 Pro Max" }, { name: "iPhone 13 Pro" }, { name: "iPhone 13" }, { name: "iPhone 13 mini" },
        { name: "iPhone 12 Pro Max" }, { name: "iPhone 12 Pro" }, { name: "iPhone 12" }, { name: "iPhone 12 mini" },
        { name: "iPhone SE (3rd gen)" }, { name: "iPhone SE (2nd gen)" },
        { name: "iPhone 11 Pro Max" }, { name: "iPhone 11 Pro" }, { name: "iPhone 11" },
        { name: "iPhone XR" }, { name: "iPhone XS Max" }, { name: "iPhone XS" }, { name: "iPhone X" },
      ],
    },
    {
      name: "Xiaomi",
      models: [
        { name: "Xiaomi 14 Ultra" }, { name: "Xiaomi 14 Pro" }, { name: "Xiaomi 14" },
        { name: "Xiaomi 13T Pro" }, { name: "Xiaomi 13T" },
        { name: "Xiaomi 13 Ultra" }, { name: "Xiaomi 13 Pro" }, { name: "Xiaomi 13" }, { name: "Xiaomi 13 Lite" },
        { name: "Redmi Note 13 Pro+" }, { name: "Redmi Note 13 Pro" }, { name: "Redmi Note 13" },
        { name: "Redmi Note 12 Pro+" }, { name: "Redmi Note 12 Pro" }, { name: "Redmi Note 12" },
        { name: "Poco F6 Pro" }, { name: "Poco F6" }, { name: "Poco X6 Pro" }, { name: "Poco X6" }, { name: "Poco M6 Pro" },
        { name: "Poco F5 Pro" }, { name: "Poco F5" },
      ],
    },
    {
      name: "Motorola",
      models: [
        { name: "Moto Razr 40 Ultra / Razr+" }, { name: "Moto Razr 40 / Razr" },
        { name: "Moto Edge 50 Ultra" }, { name: "Moto Edge 50 Pro" }, { name: "Moto Edge 50 Fusion" },
        { name: "Moto Edge 40 Pro" }, { name: "Moto Edge 40" }, { name: "Moto Edge 40 Neo" },
        { name: "Moto G84" }, { name: "Moto G54" }, { name: "Moto G24 Power" }, { name: "Moto G24" },
        { name: "Moto G Stylus 5G (2023)" },
      ],
    },
    {
      name: "Google",
      models: [
        { name: "Pixel 8 Pro" }, { name: "Pixel 8" }, { name: "Pixel 8a" },
        { name: "Pixel Fold" },
        { name: "Pixel 7 Pro" }, { name: "Pixel 7" }, { name: "Pixel 7a" },
        { name: "Pixel 6 Pro" }, { name: "Pixel 6" }, { name: "Pixel 6a" },
      ],
    },
    {
      name: "Huawei",
      models: [
        { name: "Pura 70 Ultra" }, { name: "Pura 70 Pro+" }, { name: "Pura 70 Pro" }, { name: "Pura 70" },
        { name: "Mate 60 Pro+" }, { name: "Mate 60 Pro" }, { name: "Mate 60" },
        { name: "P60 Pro" }, { name: "P60 Art" },
        { name: "Nova 12 Ultra" }, { name: "Nova 12 Pro" }, { name: "Nova 12" },
      ],
    },
    {
      name: "OnePlus",
      models: [
        { name: "OnePlus 12" }, { name: "OnePlus 12R" },
        { name: "OnePlus Open" },
        { name: "OnePlus 11" }, { name: "OnePlus 11R" },
        { name: "OnePlus Nord 3" },
      ],
    },
    // Add more brands and models as needed
  ],
  TABLET: [
    {
      name: "Apple",
      models: [
        { name: "iPad Pro 12.9 (6th gen)" }, { name: "iPad Pro 11 (4th gen)" },
        { name: "iPad Air (5th gen)" },
        { name: "iPad (10th gen)" }, { name: "iPad (9th gen)" },
        { name: "iPad mini (6th gen)" },
      ],
    },
    {
      name: "Samsung",
      models: [
        { name: "Galaxy Tab S9 Ultra" }, { name: "Galaxy Tab S9+" }, { name: "Galaxy Tab S9" }, { name: "Galaxy Tab S9 FE+" }, { name: "Galaxy Tab S9 FE" },
        { name: "Galaxy Tab S8 Ultra" }, { name: "Galaxy Tab S8+" }, { name: "Galaxy Tab S8" },
        { name: "Galaxy Tab A9+" }, { name: "Galaxy Tab A9" },
      ],
    },
    {
      name: "Xiaomi",
      models: [
        { name: "Xiaomi Pad 6S Pro" }, { name: "Xiaomi Pad 6 Pro" }, { name: "Xiaomi Pad 6" }, { name: "Xiaomi Pad 6 Max" },
        { name: "Redmi Pad SE" },
      ],
    },
    {
      name: "Lenovo",
      models: [
        { name: "Tab P12 Pro" }, { name: "Tab P11 Pro (Gen 2)" }, { name: "Tab P11 (Gen 2)" },
        { name: "Tab M10 Plus (Gen 3)" }, { name: "Tab M9" },
      ],
    },
    // Add more brands and models
  ],
  NOTEBOOK: [
    {
      name: "Apple",
      models: [
        { name: "MacBook Pro 16 (M3 Max/Pro)" }, { name: "MacBook Pro 14 (M3 Max/Pro/M3)" },
        { name: "MacBook Air 15 (M3)" }, { name: "MacBook Air 13 (M3)" },
        { name: "MacBook Air 15 (M2)" }, { name: "MacBook Air 13 (M2)" },
        { name: "MacBook Pro 13 (M2)" },
      ],
    },
    {
      name: "Dell",
      models: [
        { name: "XPS 17" }, { name: "XPS 15" }, { name: "XPS 13 Plus" }, { name: "XPS 13" },
        { name: "Alienware m18" }, { name: "Alienware x16" },
        { name: "Inspiron 16" }, { name: "Inspiron 15" }, { name: "Inspiron 14" },
        { name: "Latitude 9000 series" }, { name: "Latitude 7000 series" }, { name: "Latitude 5000 series" },
      ],
    },
    {
      name: "HP",
      models: [
        { name: "Spectre x360 16" }, { name: "Spectre x360 14" },
        { name: "Envy x360 15" }, { name: "Envy 16" }, { name: "Envy 17" },
        { name: "Pavilion Aero 13" }, { name: "Pavilion 15" },
        { name: "Omen Transcend 16" }, { name: "Omen 17" },
        { name: "EliteBook 1000 series" }, { name: "EliteBook 800 series" },
      ],
    },
    {
      name: "Lenovo",
      models: [
        { name: "ThinkPad X1 Carbon (Gen 12)" }, { name: "ThinkPad X1 Yoga (Gen 9)" }, { name: "ThinkPad T16 (Gen 3)" }, { name: "ThinkPad P1 (Gen 7)" },
        { name: "Yoga Pro 9i" }, { name: "Yoga Slim 7i ProX" },
        { name: "IdeaPad Slim 5 Pro" }, { name: "IdeaPad Gaming 3" },
        { name: "Legion Pro 7i" }, { name: "Legion Slim 5" },
      ],
    },
    {
      name: "Asus",
      models: [
        { name: "ROG Zephyrus G16" }, { name: "ROG Strix SCAR 18" },
        { name: "Zenbook Pro 16X OLED" }, { name: "Zenbook S 13 OLED" },
        { name: "Vivobook Pro 15 OLED" }, { name: "Vivobook S 14X OLED" },
      ],
    },
    {
      name: "Acer",
      models: [
        { name: "Swift Edge 16" }, { name: "Swift Go 14" },
        { name: "Aspire 7" }, { name: "Aspire 5" },
        { name: "Predator Helios 18" }, { name: "Predator Triton 16" },
      ],
    },
    // Add more brands and models
  ],
  CONSOLE: [
    {
      name: "Sony",
      models: [
        { name: "PlayStation 5 (PS5) Disc Edition" }, { name: "PlayStation 5 (PS5) Digital Edition" }, { name: "PlayStation 5 Slim Disc" }, { name: "PlayStation 5 Slim Digital" },
        { name: "PlayStation 4 Pro (PS4 Pro)" }, { name: "PlayStation 4 Slim (PS4 Slim)" }, { name: "PlayStation 4 (PS4)" },
        { name: "PlayStation Portal" },
        { name: "PlayStation VR2 (PSVR2)" },
      ],
    },
    {
      name: "Microsoft",
      models: [
        { name: "Xbox Series X" }, { name: "Xbox Series S" },
        { name: "Xbox One X" }, { name: "Xbox One S" }, { name: "Xbox One" },
      ],
    },
    {
      name: "Nintendo",
      models: [
        { name: "Switch OLED Model" }, { name: "Switch" }, { name: "Switch Lite" },
      ],
    },
    {
        name: "Valve",
        models: [
            { name: "Steam Deck LCD" }, { name: "Steam Deck OLED"},
        ]
    },
    {
        name: "Asus",
        models: [
            { name: "ROG Ally"},
        ]
    },
    {
        name: "Lenovo",
        models: [
            { name: "Legion Go"},
        ]
    }
    // Add more brands and models
  ],
};

    