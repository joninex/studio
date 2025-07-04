import { z } from 'zod';
import { CLASSIFICATION_OPTIONS, ORDER_STATUSES, CHECKLIST_ITEMS, PART_CATEGORIES, PART_UNITS, USER_ROLES_VALUES, FISCAL_CONDITIONS } from './constants';
import type { OrderStatus, Classification, Checklist, PartCategory, PartUnit, UserRole, FiscalCondition } from '@/types';

export const LoginSchema = z.object({
  username: z.string().min(1, { message: "El nombre de usuario es requerido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

const checklistShapeObject = CHECKLIST_ITEMS.reduce((acc, item) => {
  if (item.type === 'boolean') {
    // @ts-ignore
    acc[item.id] = z.enum(['si', 'no', 'sc']);
  } else {
    // @ts-ignore
    acc[item.id] = z.string().optional().or(z.literal(''));
  }
  return acc;
}, {} as Record<keyof Checklist, z.ZodTypeAny>);

export const ChecklistSchema = z.object(checklistShapeObject);

const validOrderStatuses = ORDER_STATUSES.filter(status => status !== "") as [OrderStatus, ...OrderStatus[]];
const validClassificationOptions = CLASSIFICATION_OPTIONS.filter(opt => opt !== null) as [Classification, ...Classification[]];

export const OrderPartItemSchema = z.object({
  partId: z.string().min(1, "El ID del repuesto es requerido."),
  partName: z.string().min(1, "El nombre del repuesto es requerido."),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1.").int("La cantidad debe ser un número entero."),
  unitPrice: z.number().nonnegative("El precio unitario no puede ser negativo."),
  costPrice: z.number().nonnegative("El costo unitario no puede ser negativo."),
});

export const OrderSchema = z.object({
  branchId: z.string().min(1, "La sucursal es requerida."),
  clientId: z.string().min(1, "ID de Cliente es requerido."),
  clientName: z.string().optional(),
  clientLastName: z.string().optional(),
  assignedTechnicianId: z.string().optional(),
  assignedTechnicianName: z.string().optional(),
  deviceBrand: z.string().min(1, "Marca del equipo es requerida."),
  deviceModel: z.string().min(1, "Modelo del equipo es requerida."),
  deviceColor: z.string().optional(),
  deviceIMEI: z.string().max(16, "IMEI no puede exceder 16 caracteres.").optional().or(z.literal('')),
  imeiNotVisible: z.boolean().default(false),
  accessories: z.string().optional(),
  declaredFault: z.string().min(1, "Falla declarada es requerida."),
  unlockPatternProvided: z.boolean().default(false),
  checklist: ChecklistSchema,
  damageRisk: z.string().optional(),
  costSparePart: z.number().nonnegative(),
  costLabor: z.number().nonnegative(),
  observations: z.string().optional(),
  partsUsed: z.array(OrderPartItemSchema).optional(),
  estimatedCompletionTime: z.string().optional().or(z.literal('')),
  status: z.enum(validOrderStatuses).optional(),
  classification: z.enum(validClassificationOptions).nullable().optional(),
  intakeFormSigned: z.boolean().optional(),
  pickupFormSigned: z.boolean().optional(),
}).refine(data => data.imeiNotVisible || (data.deviceIMEI && data.deviceIMEI.length > 0), {
    message: "El IMEI/Serie es requerido si no está marcado como 'no visible'.",
    path: ["deviceIMEI"],
});


export type OrderFormData = z.infer<typeof OrderSchema>;


const validPartCategories = PART_CATEGORIES.filter(cat => cat !== undefined) as [PartCategory, ...PartCategory[]];
const validPartUnits = PART_UNITS;

export const PartSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
    sku: z.string().optional().or(z.literal('')),
    description: z.string().optional().or(z.literal('')),
    category: z.enum(validPartCategories).optional(),
    unit: z.enum(validPartUnits).default("unidad"),
    costPrice: z.number().nonnegative("El precio de costo no puede ser negativo.").default(0),
    salePrice: z.number().nonnegative("El precio de venta no puede ser negativo.").default(0),
    stock: z.number().int("El stock debe ser un número entero.").nonnegative("El stock no puede ser negativo.").default(0),
    minStock: z.number().int("El stock mínimo debe ser un número entero.").nonnegative("El stock mínimo no puede ser negativo.").optional().default(0),
    supplierInfo: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    imageUrl: z.string().optional().or(z.literal('')),
});

export type PartFormData = z.infer<typeof PartSchema>;

export const SupplierSchema = z.object({
    name: z.string().min(3, "El nombre del proveedor es requerido."),
    contactName: z.string().optional().or(z.literal('')),
    phone: z.string().min(1, "El teléfono es requerido."),
    email: z.string().email("Debe ser un email válido.").optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    cuit: z.string().optional().or(z.literal('')),
    sellsDescription: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
});

export type SupplierFormData = z.infer<typeof SupplierSchema>;


export const ResetPasswordSchema = z.object({
  username: z.string().min(1, { message: "El nombre de usuario es requerido." }),
});

const validFiscalConditions = FISCAL_CONDITIONS.filter(fc => fc !== undefined) as [FiscalCondition, ...FiscalCondition[]];

export const ClientSchema = z.object({
    name: z.string().min(2, "El nombre es requerido."),
    lastName: z.string().min(2, "El apellido es requerido."),
    dni: z.string().min(7, "El DNI debe tener al menos 7 dígitos.").max(9, "El DNI no puede exceder los 9 dígitos."),
    phone: z.string().min(8, "El teléfono es requerido."),
    phone2: z.string().optional().or(z.literal('')),
    email: z.string().email("Email inválido.").optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    businessName: z.string().optional().or(z.literal('')),
    cuit: z.string().optional().or(z.literal('')),
    fiscalCondition: z.enum(validFiscalConditions).optional(),
    notes: z.string().optional().or(z.literal('')),
});
export type ClientFormData = z.infer<typeof ClientSchema>;


const validUserRoles = USER_ROLES_VALUES as [UserRole, ...UserRole[]];
export const UserSchema = z.object({
    name: z.string().min(3, "El nombre es requerido."),
    email: z.string().email("Email inválido."),
    role: z.enum(validUserRoles),
    sector: z.string().optional().or(z.literal('')),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
    avatarUrl: z.string().optional().or(z.literal('')),
});

export const ProfileUpdateSchema = z.object({
    name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
    avatarUrl: z.string().optional().or(z.literal('')),
});


export const StoreSettingsSchema = z.object({
    companyName: z.string().min(1, "El nombre de la tienda es requerido."),
    companyLogoUrl: z.string().optional().or(z.literal('')),
    companyCuit: z.string().optional().or(z.literal('')),
    companyAddress: z.string().min(1, "La dirección es requerida."),
    companyContactDetails: z.string().min(1, "Los detalles de contacto son requeridos."),
    branchInfo: z.string().optional().or(z.literal('')),
    unlockDisclaimerText: z.string().min(1, "El texto es requerido."),
    abandonmentPolicyText: z.string().min(1, "El texto es requerido."),
    abandonmentPolicyDays30: z.number().int().positive(),
    abandonmentPolicyDays60: z.number().int().positive(),
    dataLossPolicyText: z.string().min(1, "El texto es requerido."),
    untestedDevicePolicyText: z.string().min(1, "El texto es requerido."),
    budgetVariationText: z.string().min(1, "El texto es requerido."),
    highRiskDeviceText: z.string().min(1, "El texto es requerido."),
    partialDamageDisplayText: z.string().min(1, "El texto es requerido."),
    warrantyVoidConditionsText: z.string().min(1, "El texto es requerido."),
    privacyPolicyText: z.string().optional().or(z.literal('')),
    warrantyConditions: z.string().min(1, "El texto es requerido."),
    pickupConditions: z.string().min(1, "El texto es requerido."),
});

export const BranchSchema = z.object({
  name: z.string().min(3, "El nombre de la sucursal es requerido."),
  address: z.string().min(5, "La dirección es requerida."),
  phone: z.string().min(1, "El teléfono es requerido."),
  email: z.string().email("Debe ser un email válido."),
  status: z.enum(['active', 'inactive']).default('active'),
});
export type BranchFormData = z.infer<typeof BranchSchema>;
