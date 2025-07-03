// src/lib/auth/server-auth-utils.ts
"use server"; // Aunque las funciones se usen en otras server actions, marcarlas aquí puede ser útil.

import { adminAuth } from "@/lib/firebase/admin";
import { getUserById } from "@/lib/actions/user.actions"; // getUserById ya está refactorizado
import type { User } from "@/types";

interface AuthResult {
  user: User | null;
  error?: string;
}

/**
 * Verifies a Firebase ID token and retrieves the corresponding user profile from Firestore.
 * Only returns active users.
 * @param idToken The Firebase ID token string.
 * @returns Promise<AuthResult> An object containing the user or an error message.
 */
export async function getAuthenticatedUser({ idToken }: { idToken?: string | null }): Promise<AuthResult> {
  if (!idToken) {
    return { user: null, error: "Token de autenticación no proporcionado." };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken || !decodedToken.uid) {
      return { user: null, error: "Token inválido o UID no encontrado." };
    }

    const userProfile = await getUserById(decodedToken.uid);

    if (!userProfile) {
      return { user: null, error: `Perfil de usuario no encontrado para UID: ${decodedToken.uid}.` };
    }

    if (userProfile.status !== 'active') {
      return { user: null, error: `Usuario ${userProfile.email} no está activo.` };
    }

    return { user: userProfile };

  } catch (error: any) {
    console.error("Error en getAuthenticatedUser:", error.code, error.message);
    if (error.code === 'auth/id-token-expired') {
      return { user: null, error: "Token de autenticación expirado. Por favor, inicie sesión de nuevo." };
    }
    if (error.code === 'auth/argument-error') {
        return { user: null, error: "Token de autenticación malformado o inválido."};
    }
    return { user: null, error: "Error de autenticación desconocido." };
  }
}

/**
 * Higher-order function to wrap server actions with authentication and role checks.
 * @param action The server action function to wrap.
 * @param allowedRoles Optional array of UserRole strings. If provided, the user must have one of these roles.
 * @returns A new function that performs auth checks before executing the action.
 */
/* // Ejemplo de HoF para proteger acciones (más avanzado, por ahora haremos la llamada directa)
export function protectedAction<TArgs extends any[], TReturn>(
  action: (user: User, ...args: TArgs) => Promise<TReturn>,
  allowedRoles?: UserRole[]
) {
  return async (idToken: string, ...args: TArgs): Promise<TReturn | { error: string }> => {
    const authResult = await getAuthenticatedUser({ idToken });
    if (!authResult.user) {
      return { error: authResult.error || "No autorizado." };
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(authResult.user.role)) {
      return { error: "Permiso denegado. Rol no autorizado." };
    }

    return action(authResult.user, ...args);
  };
}
*/

/**
 * Checks if the authenticated user (if admin) is operating on their own data or if they are an admin.
 * For non-admin users, checks if their branch assignment matches the target entity's branchId.
 * @param authenticatedUser The authenticated user object.
 * @param targetEntityBranchId The branchId of the entity being accessed/modified.
 * @returns boolean True if authorized, false otherwise.
 */
export function isUserAuthorizedForBranch(
    authenticatedUser: User,
    targetEntityBranchId: string
): boolean {
    if (!authenticatedUser || !targetEntityBranchId) return false;

    if (authenticatedUser.role === 'admin') {
        // Admins pueden operar en cualquier sucursal (esto podría ajustarse si hay admins de sucursal)
        return true;
    }

    // Para otros roles, verificar si alguna de sus asignaciones coincide con targetEntityBranchId
    if (authenticatedUser.assignments && authenticatedUser.assignments.length > 0) {
        return authenticatedUser.assignments.some(assignment => assignment.branchId === targetEntityBranchId);
    }

    return false; // No es admin y no tiene asignaciones o ninguna coincide
}
