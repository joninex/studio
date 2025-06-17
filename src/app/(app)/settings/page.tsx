// src/app/(app)/settings/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AlertTriangle } from "lucide-react";

export default function SettingsPage() {
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
        title="Configuración de la Aplicación"
        description="Ajuste las configuraciones generales, textos legales y políticas."
      />
       <Card className="shadow-xl">
        <CardHeader>
            <CardTitle>Parámetros Generales</CardTitle>
            <CardDescription>Configure textos legales, condiciones y políticas de abandono.</CardDescription>
        </CardHeader>
        <CardContent>
            <SettingsForm />
        </CardContent>
       </Card>
    </div>
  );
}
