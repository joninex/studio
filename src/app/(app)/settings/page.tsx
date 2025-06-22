// src/app/(app)/settings/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ProfileSettingsCard } from "@/components/settings/ProfileSettingsCard"; // Import new component
import { AlertTriangle, QrCode, Building } from "lucide-react"; 
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import Image from "next/image"; 
import { Button } from "@/components/ui/button"; 
import { Separator } from "@/components/ui/separator"; 

export default function SettingsPage() {
  const { user, loading } = useAuth();
  // For now, we'll assume the user edits the settings for their FIRST assigned branch.
  // In a real multi-branch UI, there would be a branch selector here.
  const primaryBranchId = user?.assignments?.[0]?.branchId || user?.role === 'admin' ? 'B001' : undefined;

   if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <LoadingSpinner size={48} />
        <p className="text-muted-foreground mt-2">Cargando...</p>
      </div>
    );
   }

   if (!user) {
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
        title="Configuración y Perfil"
        description="Ajuste los datos de su perfil, sucursales, textos legales e integraciones."
      />
      
      <ProfileSettingsCard user={user} />

      <Separator />
      
      {primaryBranchId ? (
        <SettingsForm branchId={primaryBranchId} />
      ) : (
         <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building className="h-6 w-6 text-primary" />
                    Configuración de Sucursal
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No está asignado a ninguna sucursal para poder editar su configuración.</p>
            </CardContent>
        </Card>
      )}
       
      <Separator />

       <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                Integración con WhatsApp
            </CardTitle>
            <CardDescription>Vincule su cuenta de WhatsApp para habilitar notificaciones y comunicación directa (Funcionalidad en desarrollo).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-4 border rounded-md bg-muted/50">
                 <Image
                    src="https://placehold.co/250x250.png?text=Escanear+QR+WhatsApp"
                    alt="WhatsApp QR Code Placeholder"
                    width={250}
                    height={250}
                    className="rounded-md"
                    data-ai-hint="whatsapp qr code"
                />
            </div>
            <p className="text-sm text-center text-muted-foreground max-w-md">
                Para vincular su cuenta de WhatsApp, escanee este código QR desde la aplicación WhatsApp en su teléfono (en la sección de Dispositivos Vinculados).
            </p>
            <p className="text-xs text-center text-destructive max-w-md">
                <strong>Nota:</strong> Esta es una demostración visual. La funcionalidad completa de generación dinámica de QR y vinculación de WhatsApp no está implementada.
            </p>
            <Button variant="outline" disabled>
                Generar Nuevo QR (Simulación)
            </Button>
        </CardContent>
       </Card>
    </div>
  );
}
