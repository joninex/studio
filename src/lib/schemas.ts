import { z } from 'zod';
import {
  UNLOCK_PATTERN_OPTIONS,
  CLASSIFICATION_OPTIONS,
  ORDER_STATUSES,
  USER_ROLES_VALUES,
  CHECKLIST_ITEMS,
  WARRANTY_TYPES
} from './constants';
import type { UserRole, WarrantyType } from '@/types'; 

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


const checklistShapeObject: Record<string, z.ZodEnum<['si', 'no']>> = {};
CHECKLIST_ITEMS.forEach(item => {
  checklistShapeObject[item.id] = z.enum(['si', 'no'], { required_error: `${item.label} es requerido.` });
});
export const ChecklistSchema = z.object(checklistShapeObject);


export const OrderSchema = z.object({
  clientId: z.string().min(1, "ID de Cliente es requerido."),

  branchInfo: z.string().min(1, "Información de sucursal es requerida."),

  deviceBrand: z.string().min(1, "Marca del equipo es requerida."),
  deviceModel: z.string().min(1, "Modelo del equipo es requerida."),
  deviceIMEI: z.string().min(14, "IMEI debe tener al menos 14 caracteres.").max(16, "IMEI no puede exceder 16 caracteres."),
  declaredFault: z.string().min(1, "Falla declarada es requerida."),
  unlockPatternInfo: z.enum(UNLOCK_PATTERN_OPTIONS as [string, ...string[]]),

  checklist: ChecklistSchema,

  damageRisk: z.string().optional().or(z.literal('')),
  pantalla_parcial: z.boolean().optional().default(false),
  equipo_sin_acceso: z.boolean().optional().default(false),
  perdida_informacion: z.boolean().optional().default(false),

  previousOrderId: z.string().optional().or(z.literal('')),

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

  classification: z.enum(CLASSIFICATION_OPTIONS as [string, ...string[]]).optional().or(z.literal("")),
  observations: z.string().optional().or(z.literal('')),

  customerAccepted: z.boolean().optional().refine(val => val === true, { message: "El cliente debe aceptar los términos." }),
  customerSignatureName: z.string().min(1, "El nombre para la firma es requerido si se aceptan los términos.").optional().or(z.literal('')),

  status: z.enum(ORDER_STATUSES as [string, ...string[]]).default("ingreso"),

  // Warranty Fields
  hasWarranty: z.boolean().optional().default(false),
  warrantyType: z.enum(WARRANTY_TYPES as [WarrantyType, ...WarrantyType[]]).optional().nullable(),
  warrantyStartDate: z.string().optional().nullable(), // Validate as date string if needed: .refine(val => !val || !isNaN(Date.parse(val)), { message: "Fecha inválida"})
  warrantyEndDate: z.string().optional().nullable(),   // Validate as date string if needed
  warrantyCoveredItem: z.string().optional().nullable(),
  warrantyNotes: z.string().optional().nullable(),

}).superRefine((data, ctx) => {
  if (data.customerAccepted && (!data.customerSignatureName || data.customerSignatureName.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El nombre para la firma es requerido si el cliente acepta los términos.",
      path: ["customerSignatureName"],
    });
  }
  if (data.hasWarranty) {
    if (!data.warrantyType || data.warrantyType === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El tipo de garantía es requerido.", path: ["warrantyType"] });
    }
    if (!data.warrantyStartDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha de inicio de garantía es requerida.", path: ["warrantyStartDate"] });
    } else {
        // Validate date format if it's a string. Can also use z.coerce.date()
        if (isNaN(Date.parse(data.warrantyStartDate))) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha de inicio inválida.", path: ["warrantyStartDate"] });
        }
    }
    if (!data.warrantyCoveredItem || data.warrantyCoveredItem.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El ítem/procedimiento cubierto es requerido.", path: ["warrantyCoveredItem"] });
    }
    if (data.warrantyType !== 'custom' && !data.warrantyEndDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha de fin de garantía es requerida o será auto-calculada.", path: ["warrantyEndDate"] });
    }
    if (data.warrantyType === 'custom' && !data.warrantyEndDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha de fin de garantía es requerida para tipo personalizado.", path: ["warrantyEndDate"] });
    }


    if (data.warrantyStartDate && data.warrantyEndDate) {
      const startDate = new Date(data.warrantyStartDate);
      const endDate = new Date(data.warrantyEndDate);
      if (isNaN(startDate.getTime())) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha de inicio inválida.", path: ["warrantyStartDate"] });
      }
      if (isNaN(endDate.getTime())) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha de fin inválida.", path: ["warrantyEndDate"] });
      }
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate < startDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha de fin debe ser posterior o igual a la fecha de inicio.", path: ["warrantyEndDate"] });
      }
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
  role: z.enum(USER_ROLES_VALUES as [UserRole, ...UserRole[]]),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
});

export const StoreSettingsSchema = z.object({
  companyName: z.string().min(1, "Nombre de la empresa es requerido.").optional().or(z.literal('')),
  companyLogoUrl: z.string().url({ message: "Debe ser una URL válida para el logo." }).optional().or(z.literal('')),
  companyCuit: z.string().optional().or(z.literal('')),
  companyAddress: z.string().optional().or(z.literal('')),
  companyContactDetails: z.string().min(1, "Detalles de contacto de la empresa son requeridos.").optional().or(z.literal('')),
  branchInfo: z.string().min(1, "Información de sucursal/taller es requerida.").optional().or(z.literal('')),
  warrantyConditions: z.string().min(1, "Condiciones de garantía son requeridas.").optional().or(z.literal('')),
  pickupConditions: z.string().min(1, "Condiciones de retiro son requeridas.").optional().or(z.literal('')),
  abandonmentPolicyDays30: z.preprocess(
    (val) => (typeof val === 'string' && val !== "" ? parseInt(val, 10) : (typeof val === 'number' ? val : undefined)),
    z.number().int().positive("Debe ser un número positivo.").optional()
  ).default(30),
  abandonmentPolicyDays60: z.preprocess(
    (val) => (typeof val === 'string' && val !== "" ? parseInt(val, 10) : (typeof val === 'number' ? val : undefined)),
    z.number().int().positive("Debe ser un número positivo.").optional()
  ).default(60),
});

export const SettingsSchema = StoreSettingsSchema;
