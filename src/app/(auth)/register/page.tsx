// src/app/(auth)/register/page.tsx
import { RegisterForm } from "@/components/auth/RegisterForm";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

export default function RegisterPage() {
  const companyName = DEFAULT_STORE_SETTINGS.companyName || "JO-SERVICE Tech Manager";
  const logoUrl = DEFAULT_STORE_SETTINGS.companyLogoUrl || "https://placehold.co/150x50.png?text=Logo";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image 
            src={logoUrl}
            alt={`${companyName} Logo`}
            width={150} 
            height={50}
            className="mx-auto mb-6 object-contain"
            data-ai-hint="company logo"
            priority
          />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
            Registro de Usuario
          </h1>
          <p className="mt-2 text-muted-foreground">
            Cree una cuenta para acceder al sistema.
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
