// src/app/(app)/users/page.tsx
"use client"; // Needs to be client for role check from useAuth

import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagementClient } from "@/components/users/UserManagementClient";
import { AlertTriangle } from "lucide-react";

export default function UsersPage() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">
          No tiene permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Administre los usuarios del sistema (técnicos y administradores)."
      />
      <UserManagementClient />
    </div>
  );
}
