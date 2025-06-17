// src/app/(auth)/reset-password/page.tsx
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import Image from "next/image";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image 
            src="https://placehold.co/150x50.png?text=Logo" 
            alt="Company Logo" 
            width={150} 
            height={50}
            className="mx-auto mb-6 object-contain"
            data-ai-hint="company logo"
          />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
            Restablecer Contraseña
          </h1>
          <p className="mt-2 text-muted-foreground">
            Ingrese su email para restablecer su contraseña.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
