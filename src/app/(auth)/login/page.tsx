// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm";
import { Smartphone } from "lucide-react";
import Link from "next/link"; 

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/50 bg-primary/20 text-primary shadow-[0_0_20px_theme(colors.primary.DEFAULT)]">
             <Smartphone className="h-8 w-8"/>
           </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">
            NexusServ 360
          </h1>
          <p className="mt-2 text-muted-foreground">
            Bienvenido al Centro de Comando de Reparaciones
          </p>
        </div>
        <LoginForm />
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            ¿No tiene una cuenta?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrese aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
