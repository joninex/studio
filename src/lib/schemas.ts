import { z } from 'zod';
import {
  CLASSIFICATION_OPTIONS,
  ORDER_STATUSES,
  USER_ROLES_VALUES,
  CHECKLIST_ITEMS,
  WARRANTY_TYPE_OPTIONS, 
  SALE_CON_HUELLA_OPTIONS,
  PART_CATEGORIES, // New
  PART_UNITS // New
} from './constants';
import type { UserRole, WarrantyType, OrderStatus, Classification, Checklist, PartCategory, PartUnit } from '@/types'; // New PartCategory, PartUnit

export const LoginSchema = z.object({
  email: z.string().email({ message: "Por favor ingrese un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export const RegisterSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor ingrese un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

export const ClientSchema = z.object({
  name: z.string().min(1, "Nombre del cliente es requerido."),
  lastName: z.string().min(1, "Apellido del cliente es requerido."),
  dni: z.string().min(7, "DNI debe tener al menos 7 caracteres.").max(10, "DNI no puede exceder 10 caracteres."),
  phone: z.string().min(7, "Teléfono debe tener al menos 7 caracteres."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});
export type ClientFormData = z.infer<typeof ClientSchema>;


const checklistShapeObject: Record<keyof Checklist, z.ZodTypeAny> = CHECKLIST_ITEMS.reduce((acc, item) => {
  if (item.type === 'boolean') {
    // @ts-ignore
    acc[item.id] = z.enum(['si', 'no']);
  } else if (item.type === 'text') {
    // @ts-ignore
    acc[item.id] = z.string().optional().or(z.literal(''));
  } else if (item.type === 'enum_saleConHuella') {
    // @ts-ignore
    acc[item.id] = z.enum(SALE_CON_HUELLA_OPTIONS.map(o => o.value) as [string, ...string[]]).optional();
  }
  return acc;
}, {} as Record<keyof Checklist, z.ZodTypeAny>);


export const ChecklistSchema = z.object(checklistShapeObject);

const validOrderStatuses = ORDER_STATUSES.filter(status => status !== "") as [OrderStatus, ...OrderStatus[]];
const validClassificationOptions = CLASSIFICATION_OPTIONS.filter(opt => opt !== null) as [Classification, ...Classification[]];
const validWarrantyTypeEnumValues = WARRANTY_TYPE_OPTIONS.map(opt => opt.value) as [Exclude<WarrantyType, null | ''>, ...Exclude<WarrantyType, null | ''>[]];


export const OrderSchema = z.object({
  clientId: z.string().min(1, "ID de Cliente es requerido."),
  branchInfo: z.string().min(1, "Información de sucursal es requerida."),
  deviceBrand: z.string().min(1, "Marca del equipo es requerida."),
  deviceModel: z.string().min(1, "Modelo del equipo es requerida."),
  deviceIMEI: z.string().min(14, "IMEI debe tener al menos 14 caracteres.").max(16, "IMEI no puede exceder 16 caracteres."),
  declaredFault: z.string().min(1, "Falla declarada es requerida."),
  unlockPatternInfo: z.string().min(1, "PIN, Patrón o Contraseña del dispositivo es requerido."),
  checklist: ChecklistSchema,
  damageRisk: z.string().optional().or(z.literal('')),
  pantalla_parcial: z.boolean().optional().default(false),
  equipo_sin_acceso: z.boolean().optional().default(false),
  perdida_informacion: z.boolean().optional().default(false),
  previousOrderId: z.string().optional().or(z.literal('')),
  promisedDeliveryDate: z.string().nullable().optional(), 
  costSparePart: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).nonnegative("Costo debe ser no negativo.")
  ).default(0),
  costLabor: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).nonnegative("Costo debe ser no negativo.")
  ).default(0),
  costPending: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).nonnegative("Costo debe ser no negativo.")
  ).default(0),
  classification: z.enum(validClassificationOptions).nullable().optional(), 
  observations: z.string().optional().or(z.literal('')),
  customerAccepted: z.boolean().optional().default(false), 
  customerSignatureName: z.string().optional().or(z.literal('')),
  
  orderSnapshottedUnlockDisclaimer: z.string().optional().or(z.literal('')),
  orderSnapshottedAbandonmentPolicyText: z.string().optional().or(z.literal('')),
  orderSnapshottedDataLossPolicyText: z.string().optional().or(z.literal('')),
  orderSnapshottedUntestedDevicePolicyText: z.string().optional().or(z.literal('')),
  orderSnapshottedBudgetVariationText: z.string().optional().or(z.literal('')),
  orderSnapshottedHighRiskDeviceText: z.string().optional().or(z.literal('')),
  orderSnapshottedPartialDamageDisplayText: z.string().optional().or(z.literal('')),
  orderSnapshottedWarrantyVoidConditionsText: z.string().optional().or(z.literal('')),
  orderSnapshottedPrivacyPolicy: z.string().optional().or(z.literal('')),
  orderWarrantyConditions: z.string().optional().or(z.literal('')),
  pickupConditions: z.string().optional().or(z.literal('')), 
  
  dataLossDisclaimerAccepted: z.boolean().optional().default(false), 
  privacyPolicyAccepted: z.boolean().optional().default(false), 
  
  status: z.enum(validOrderStatuses).default("Recibido"),
  hasWarranty: z.boolean().optional().default(false),
  warrantyType: z.enum(validWarrantyTypeEnumValues).nullable().optional(),
  warrantyStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD).").nullable().optional(), 
  warrantyEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD).").nullable().optional(),   
  warrantyCoveredItem: z.string().optional().nullable(),
  warrantyNotes: z.string().optional().nullable(),

}).superRefine((data, ctx) => {
  if (data.customerAccepted && (!data.customerSignatureName || data.customerSignatureName.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El nombre para la firma es requerido si el cliente acepta los términos generales.",
      path: ["customerSignatureName"],
    });
  }
  
  if (data.orderSnapshottedDataLossPolicyText && data.orderSnapshottedDataLossPolicyText.trim() !== "" && !data.dataLossDisclaimerAccepted) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe aceptar el descargo de responsabilidad por pérdida de datos y política de privacidad.",
      path: ["dataLossDisclaimerAccepted"],
    });
  }

  if (data.orderSnapshottedPrivacyPolicy && data.orderSnapshottedPrivacyPolicy.trim() !== "" && data.orderSnapshottedDataLossPolicyText !== data.orderSnapshottedPrivacyPolicy && !data.privacyPolicyAccepted) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe aceptar la política de privacidad.",
      path: ["privacyPolicyAccepted"],
    });
  }

  if (data.hasWarranty) {
    if (!data.warrantyType) { 
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El tipo de garantía es requerido.", path: ["warrantyType"] });
    }
    if (!data.warrantyStartDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha de inicio de garantía es requerida.", path: ["warrantyStartDate"] });
    }
    if (!data.warrantyCoveredItem || data.warrantyCoveredItem.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El ítem/procedimiento cubierto es requerido.", path: ["warrantyCoveredItem"] });
    }
    
    if (data.warrantyType === 'custom' && !data.warrantyEndDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha de fin de garantía es requerida para tipo personalizado.", path: ["warrantyEndDate"] });
    }

    if (data.warrantyStartDate && data.warrantyEndDate) {
      try {
        const startDate = new Date(data.warrantyStartDate);
        const endDate = new Date(data.warrantyEndDate);
        startDate.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);

        if (isNaN(startDate.getTime())) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha de inicio inválida.", path: ["warrantyStartDate"] });
        }
        if (isNaN(endDate.getTime())) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha de fin inválida.", path: ["warrantyEndDate"] });
        }
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate < startDate) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha de fin debe ser posterior o igual a la fecha de inicio.", path: ["warrantyEndDate"] });
        }
      } catch (e) { /* Handled by regex */ }
    }
  }

  if (data.promisedDeliveryDate) {
    try {
      const date = new Date(data.promisedDeliveryDate);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fecha y hora prometida de entrega inválida.",
          path: ["promisedDeliveryDate"],
        });
      }
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Formato de Fecha y hora prometida de entrega inválido.",
        path: ["promisedDeliveryDate"],
      });
    }
  }
});

export type OrderFormData = z.infer<typeof OrderSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor ingrese un email válido." }),
});

export const UserSchema = z.object({
  name: z.string().min(1, "Nombre es requerido."),
  email: z.string().email("Email inválido."),
  avatarUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
  role: z.enum(USER_ROLES_VALUES as [UserRole, ...UserRole[]]),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().min(1, "Nombre es requerido."),
  avatarUrl: z.string().url({ message: "Debe ser una URL válida para el avatar." }).optional().or(z.literal('')),
});


export const StoreSettingsSchema = z.object({
  companyName: z.string().min(1, "Nombre de la empresa es requerido.").optional().or(z.literal('')),
  companyLogoUrl: z.string().url({ message: "Debe ser una URL válida para el logo." }).optional().or(z.literal('')),
  companyCuit: z.string().optional().or(z.literal('')),
  companyAddress: z.string().optional().or(z.literal('')),
  companyContactDetails: z.string().min(1, "Detalles de contacto de la empresa son requeridos.").optional().or(z.literal('')),
  branchInfo: z.string().min(1, "Información de sucursal/taller es requerida.").optional().or(z.literal('')),
  
  warrantyConditions: z.string().optional().or(z.literal('')), 
  pickupConditions: z.string().optional().or(z.literal('')), 

  unlockDisclaimerText: z.string().optional().or(z.literal('')),
  abandonmentPolicyText: z.string().optional().or(z.literal('')),
  dataLossPolicyText: z.string().optional().or(z.literal('')),
  untestedDevicePolicyText: z.string().optional().or(z.literal('')),
  budgetVariationText: z.string().optional().or(z.literal('')),
  highRiskDeviceText: z.string().optional().or(z.literal('')),
  partialDamageDisplayText: z.string().optional().or(z.literal('')),
  warrantyVoidConditionsText: z.string().optional().or(z.literal('')),
  privacyPolicyText: z.string().optional().or(z.literal('')),

  abandonmentPolicyDays30: z.preprocess(
    (val) => (typeof val === 'string' && val !== "" ? parseInt(val, 10) : (typeof val === 'number' ? val : undefined)),
    z.number().int().positive("Debe ser un número positivo.").optional().nullable()
  ).default(30),
  abandonmentPolicyDays60: z.preprocess(
    (val) => (typeof val === 'string' && val !== "" ? parseInt(val, 10) : (typeof val === 'number' ? val : undefined)),
    z.number().int().positive("Debe ser un número positivo.").optional().nullable()
  ).default(60),
});

export const SettingsSchema = StoreSettingsSchema;

// Inventory Schemas
const validPartCategories = PART_CATEGORIES.filter(cat => cat !== "") as [PartCategory, ...PartCategory[]];
const validPartUnits = PART_UNITS as [PartUnit, ...PartUnit[]];

export const PartSchema = z.object({
  name: z.string().min(1, "Nombre del repuesto es requerido."),
  sku: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  category: z.enum(validPartCategories).optional().or(z.literal("").transform(() => undefined)), // Allow empty string from select to be undefined
  unit: z.enum(validPartUnits).optional(),
  costPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).nonnegative("Costo debe ser no negativo.")
  ).default(0),
  salePrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).nonnegative("Precio debe ser no negativo.")
  ).default(0),
  stock: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).int("Stock debe ser un entero.").nonnegative("Stock debe ser no negativo.")
  ).default(0),
  minStock: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).int("Stock mínimo debe ser un entero.").nonnegative("Stock debe ser no negativo.").optional()
  ).default(0),
  supplierInfo: z.string().optional().or(z.literal('')), // Simple text for now
  notes: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "URL de imagen inválida." }).optional().or(z.literal('')),
});

export type PartFormData = z.infer<typeof PartSchema>;
