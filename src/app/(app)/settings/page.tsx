// src/app/(app)/settings/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ProfileSettingsCard } from "@/components/settings/ProfileSettingsCard"; // Import new component
import { AlertTriangle, QrCode, Building, DatabaseBackup, AlertCircle } from "lucide-react"; 
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import Image from "next/image"; 
import { Button } from "@/components/ui/button"; 
import { Separator } from "@/components/ui/separator"; 
import { useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { createBackup, restoreBackup, checkBackupExists } from "@/lib/actions/system.actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";


export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isBackupTransitioning, startBackupTransition] = useTransition();
  const [backupFileExists, setBackupFileExists] = useState(false);

  // For now, we'll assume the user edits the settings for their FIRST assigned branch.
  // In a real multi-branch UI, there would be a branch selector here.
  const primaryBranchId = user?.assignments?.[0]?.branchId || (user?.role === 'admin' ? 'B001' : undefined);

   useEffect(() => {
    if (user?.role === 'admin') {
      checkBackupExists().then(setBackupFileExists);
    }
  }, [user]);

  const handleCreateBackup = () => {
    startBackupTransition(async () => {
      const result = await createBackup();
      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        checkBackupExists().then(setBackupFileExists); // Re-check after creation
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleRestoreBackup = () => {
    startBackupTransition(async () => {
      const result = await restoreBackup();
      if (result.success) {
        toast({ title: "Restauración Exitosa", description: result.message });
        // Force a hard reload to ensure all in-memory data is refreshed application-wide
        window.location.reload();
      } else {
        toast({ variant: "destructive", title: "Error de Restauración", description: result.message });
      }
    });
  };

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

      {user.role === 'admin' && (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DatabaseBackup className="h-6 w-6 text-primary" />
                    Gestión de Backups y Restauración
                </CardTitle>
                <CardDescription>Cree o restaure un snapshot completo de los datos de la aplicación (órdenes, clientes, usuarios, etc.).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 border rounded-lg bg-muted/50">
                    <div>
                        <h4 className="font-semibold">Crear un Nuevo Backup</h4>
                        <p className="text-sm text-muted-foreground">Esto guardará el estado actual de todos los datos en un archivo `gori_backup.json`.</p>
                    </div>
                    <Button onClick={handleCreateBackup} disabled={isBackupTransitioning}>
                        {isBackupTransitioning ? <LoadingSpinner size={16} className="mr-2"/> : null}
                        Crear Backup Ahora
                    </Button>
                </div>

                 <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 border rounded-lg bg-muted/50">
                    <div>
                        <h4 className="font-semibold">Restaurar desde Backup</h4>
                        <p className="text-sm text-muted-foreground">Esto reemplazará todos los datos actuales con los del archivo `gori_backup.json`.</p>
                    </div>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={isBackupTransitioning || !backupFileExists}>
                            {isBackupTransitioning ? <LoadingSpinner size={16} className="mr-2"/> : null}
                            Restaurar Backup
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader className="text-center items-center">
                          <AlertTriangle className="h-16 w-16 text-destructive mb-2" />
                          <AlertDialogTitle className="text-2xl">¿Está absolutamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción es irreversible. Todos los datos actuales (órdenes, clientes, usuarios, etc.) serán eliminados y reemplazados por los datos del archivo de backup. 
                            La aplicación se recargará.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="sm:justify-center pt-4">
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRestoreBackup}
                            disabled={isBackupTransitioning}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                             {isBackupTransitioning && <LoadingSpinner size={16} className="mr-2"/>}
                            Sí, restaurar y reemplazar todo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                 {!backupFileExists && (
                    <div className="text-sm text-muted-foreground text-center">No se encontró un archivo `gori_backup.json`. Cree uno para poder restaurar.</div>
                 )}
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
