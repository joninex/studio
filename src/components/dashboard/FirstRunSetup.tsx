// src/components/dashboard/FirstRunSetup.tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Building, Users, Settings, Rocket } from "lucide-react";
import type { Branch, User } from "@/types";

interface FirstRunSetupProps {
  branches: Branch[];
  users: User[];
}

export function FirstRunSetup({ branches, users }: FirstRunSetupProps) {
  const branchesExist = branches.length > 0;
  const otherUsersExist = users.length > 1;

  return (
    <Card className="shadow-xl border-primary/50 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Rocket className="h-8 w-8 text-primary" />
          ¡Bienvenido a NexusServ 360!
        </CardTitle>
        <CardDescription>
          Parece que es su primera vez aquí. Siga estos pasos para configurar su taller.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <Check className={`h-5 w-5 ${branchesExist ? "text-green-500" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <h4 className="font-semibold">Paso 1: Cree su primera sucursal</h4>
              <p className="text-sm text-muted-foreground">Las sucursales son los talleres o tiendas donde se gestionan las órdenes.</p>
            </div>
            {!branchesExist && (
               <Button asChild size="sm">
                <Link href="/settings/branches/new">
                    <Building className="mr-2 h-4 w-4" /> Crear Sucursal
                </Link>
               </Button>
            )}
          </li>
          <li className={`flex items-center gap-3 ${!branchesExist ? "opacity-50" : ""}`}>
            <Check className="h-5 w-5 text-muted-foreground" />
             <div className="flex-1">
              <h4 className="font-semibold">Paso 2: Configure los datos de su sucursal</h4>
              <p className="text-sm text-muted-foreground">Personalice el nombre, dirección y textos legales para sus comprobantes.</p>
            </div>
             <Button asChild size="sm" variant="outline" disabled={!branchesExist}>
                <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" /> Ir a Configuración
                </Link>
            </Button>
          </li>
           <li className={`flex items-center gap-3 ${!branchesExist ? "opacity-50" : ""}`}>
            <Check className={`h-5 w-5 ${otherUsersExist ? "text-green-500" : "text-muted-foreground"}`} />
             <div className="flex-1">
              <h4 className="font-semibold">Paso 3: Añada a su equipo</h4>
              <p className="text-sm text-muted-foreground">Cree las cuentas para sus técnicos y recepcionistas.</p>
            </div>
            <Button asChild size="sm" disabled={!branchesExist}>
                <Link href="/users">
                    <Users className="mr-2 h-4 w-4" /> Añadir Usuarios
                </Link>
            </Button>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
