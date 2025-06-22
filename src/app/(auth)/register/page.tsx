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
            src="https://placehold.co/150x50.png?text=NexusServ+360" 
            alt="NexusServ 360 Logo" 
            width={150} 
            height={50}
            className="mx-auto mb-6"
            data-ai-hint="company logo"
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
