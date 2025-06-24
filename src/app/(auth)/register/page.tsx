// src/app/(auth)/register/page.tsx
import { RegisterForm } from "@/components/auth/RegisterForm";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image
              src="https://placehold.co/128x128.png"
              width={128}
              height={128}
              alt="G.O.R.I Logo"
              className="mx-auto mb-4 rounded-2xl border border-primary/50 bg-card p-2 shadow-[0_0_20px_theme(colors.primary.DEFAULT)]"
              data-ai-hint="isometric schematic"
          />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
            Registro de Usuario
          </h1>
          <p className="mt-2 text-muted-foreground">
            Cree una cuenta para acceder al sistema G.O.R.I.
          </p>
        </div>
        <RegisterForm />
         <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            ¿Ya tiene una cuenta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Inicie sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
