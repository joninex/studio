// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";
import Link from "next/link"; // Import Link for Register button
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";


export default async function LoginPage() {
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
            {companyName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Bienvenido. Por favor, inicie sesión.
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
