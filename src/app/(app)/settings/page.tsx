// src/app/(app)/settings/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function SettingsPage() {
  const { user, loading } = useAuth();

   if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <LoadingSpinner size={48} />
        <p className="text-muted-foreground mt-2">Cargando...</p>
      </div>
    );
   }

   // All authenticated users can now access their own settings.
   // The admin check is removed.
   // if (user?.role !== 'admin') {
   //   return (
   //     <div className="flex flex-col items-center justify-center h-full text-center p-8">
   //       <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
   //       <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
   //       <p className="text-muted-foreground mt-2">
   //         No tiene permisos para acceder a esta sección.
   //       </p>
   //     </div>
   //   );
   // }

   if (!user) {
     // Should be handled by AuthProvider redirect, but as a fallback:
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
          <p className="text-muted-foreground mt-2">
            Debe iniciar sesión para acceder a la configuración.
          </p>
        </div>
      );
   }


  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Mi Tienda"
        description="Ajuste los datos de su tienda, textos legales y políticas."
      />
       <Card className="shadow-xl">
        <CardHeader>
            <CardTitle>Parámetros de la Tienda</CardTitle>
            <CardDescription>Configure la información de su tienda, textos legales, condiciones y políticas de abandono.</CardDescription>
        </CardHeader>
        <CardContent>
            {user && <SettingsForm userId={user.uid} />}
        </CardContent>
       </Card>
    </div>
  );
}
