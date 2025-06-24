// src/lib/actions/auth.actions.ts
"use server";

import type { User } from "@/types";
import { LoginSchema, ResetPasswordSchema, RegisterSchema } from "@/lib/schemas";
import type { z } from "zod";
import { getBranches } from "./branch.actions";
import { 
    getUserByEmail, 
    createUser as createGoriUser, 
    gori_db_passwords 
} from "./user.actions";

export async function login(
  values: z.infer<typeof LoginSchema>
): Promise<{ success: boolean; message: string; user?: User }> {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Campos inválidos." };
  }

  const { email, password } = validatedFields.data;
  const user = await getUserByEmail(email);

  if (!user) {
    return { success: false, message: "Usuario no encontrado." };
  }
  
  if (user.status !== "active") {
    let statusMessage = "Su cuenta no está activa.";
    if (user.status === "pending") statusMessage = "Su cuenta está pendiente de aprobación.";
    if (user.status === "denied") statusMessage = "El acceso para su cuenta ha sido denegado.";
    return { success: false, message: statusMessage };
  }

  // En un sistema real, GORI's auth service haría la comparación de hash.
  // Para la simulación, comparamos la contraseña en texto plano.
  if (gori_db_passwords[email] !== password) {
    return { success: false, message: "Contraseña incorrecta." };
  }
  
  return { success: true, message: "Inicio de sesión exitoso.", user };
}

export async function registerUser(
  values: z.infer<typeof RegisterSchema>
): Promise<{ success: boolean; message: string; user?: Partial<User> }> {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Datos de registro inválidos." };
  }

  const { email, password, name } = validatedFields.data;

  // Delegar la creación del usuario y la validación de email duplicado al servicio de usuarios de GORI
  const newUserResult = await createGoriUser({
    name,
    email,
    password, // La función createUser se encarga del hashing conceptual y almacenamiento.
    role: 'recepcionista', // Rol por defecto para auto-registro.
    status: "pending",
  });
  
  if (!newUserResult.success) {
    return newUserResult; // Devuelve el mensaje de error de createUser (ej. "email duplicado")
  }

  console.log(`New user pending approval: ${email}`);
  return { success: true, message: "Registro exitoso. Su cuenta está pendiente de aprobación por un administrador." };
}

export async function resetPassword(
  values: z.infer<typeof ResetPasswordSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = ResetPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, message: "Campos inválidos." };
  }

  const { email } = validatedFields.data;
  const userExists = await getUserByEmail(email);

  if (!userExists) {
    // No revelamos si el usuario existe o no por seguridad.
    return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
  }

  // Lógica de GORI para enviar el correo de restablecimiento.
  console.log(`Password reset email sent to ${email} (mock)`);
  return { success: true, message: "Si este correo está registrado, se enviará un enlace de restablecimiento." };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  return { success: true };
}
