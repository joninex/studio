import { z } from 'zod';
import { UNLOCK_PATTERN_OPTIONS, CLASSIFICATION_OPTIONS, ORDER_STATUSES, SPECIFIC_SECTORS_OPTIONS } from './constants';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Por favor ingrese un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

const checklistShape = z.object({
  carcasaMarks: z.enum(['si', 'no'], { required_error: "Requerido" }),
  screenCrystal: z.enum(['si', 'no'], { required_error: "Requerido" }),
  frame: z.enum(['si', 'no'], { required_error: "Requerido" }),
  backCover: z.enum(['si', 'no'], { required_error: "Requerido" }),
  camera: z.enum(['si', 'no'], { required_error: "Requerido" }),
  microphone: z.enum(['si', 'no'], { required_error: "Requerido" }),
  speaker: z.enum(['si', 'no'], { required_error: "Requerido" }),
  powersOn: z.enum(['si', 'no'], { required_error: "Requerido" }),
  touchScreen: z.enum(['si', 'no'], { required_error: "Requerido" }),
  deviceCamera: z.enum(['si', 'no'], { required_error: "Requerido" }),
  fingerprintSensor: z.enum(['si', 'no'], { required_error: "Requerido" }),
  signal: z.enum(['si', 'no'], { required_error: "Requerido" }),
  wifi: z.enum(['si', 'no'], { required_error: "Requerido" }),
});


export const OrderSchema = z.object({
  clientName: z.string().min(1, "Nombre del cliente es requerido."),
  clientLastName: z.string().min(1, "Apellido del cliente es requerido."),
  clientDni: z.string().min(7, "DNI debe tener al menos 7 caracteres.").max(10, "DNI no puede exceder 10 caracteres."),
  clientPhone: z.string().min(7, "Teléfono debe tener al menos 7 caracteres."),
  clientEmail: z.string().email("Email inválido.").optional().or(z.literal('')),

  branchInfo: z.string().min(1, "Información de sucursal es requerida."),

  deviceBrand: z.string().min(1, "Marca del equipo es requerida."),
  deviceModel: z.string().min(1, "Modelo del equipo es requerido."),
  deviceIMEI: z.string().min(14, "IMEI debe tener al menos 14 caracteres.").max(16, "IMEI no puede exceder 16 caracteres."),
  declaredFault: z.string().min(1, "Falla declarada es requerida."),
  unlockPatternInfo: z.enum(UNLOCK_PATTERN_OPTIONS, { required_error: "Información de desbloqueo es requerida."}),

  checklist: checklistShape,

  damageRisk: z.string().optional(),
  specificSectors: z.array(z.string(SPECIFIC_SECTORS_OPTIONS)).optional(),
  previousOrderId: z.string().optional().or(z.literal('')),

  costSparePart: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).nonnegative("Costo debe ser no negativo.").optional()
  ).default(0),
  costLabor: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).nonnegative("Costo debe ser no negativo.").optional()
  ).default(0),
  costPending: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Debe ser un número" }).nonnegative("Costo debe ser no negativo.").optional()
  ).default(0),

  classification: z.enum([...CLASSIFICATION_OPTIONS, ""], { required_error: "Clasificación es requerida."}).optional(),
  observations: z.string().optional(),

  customerAccepted: z.boolean().refine(val => val === true, { message: "El cliente debe aceptar los términos." }),
  customerSignatureName: z.string().min(1, "Nombre del cliente que acepta es requerido."),

  status: z.enum([...ORDER_STATUSES, ""], { required_error: "Estado es requerido."}).default("En diagnóstico"),
});

export type OrderFormData = z.infer<typeof OrderSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor ingrese un email válido." }),
});

export const UserSchema = z.object({
  name: z.string().min(1, "Nombre es requerido."),
  email: z.string().email("Email inválido."),
  role: z.enum(['admin', 'tecnico'], { required_error: "Rol es requerido."}),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')), // Optional for updates, allow empty string if not changing
});

export const SettingsSchema = z.object({
  companyName: z.string().min(1, "Nombre de la empresa es requerido.").optional().or(z.literal('')),
  companyLogoUrl: z.string().url({ message: "Debe ser una URL válida para el logo." }).optional().or(z.literal('')),
  companyCuit: z.string().optional().or(z.literal('')),
  companyAddress: z.string().optional().or(z.literal('')),
  companyContactDetails: z.string().min(1, "Detalles de contacto de la empresa son requeridos.").optional().or(z.literal('')),
  branchInfo: z.string().min(1, "Información de sucursal/taller es requerida.").optional().or(z.literal('')),
  warrantyConditions: z.string().min(1, "Condiciones de garantía son requeridas."),
  pickupConditions: z.string().min(1, "Condiciones de retiro son requeridas."),
  abandonmentPolicyDays30: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive("Debe ser un número positivo.")
  ),
  abandonmentPolicyDays60: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive("Debe ser un número positivo.")
  ),
});
