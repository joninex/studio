// src/app/(auth)/reset-password/page.tsx
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import Image from "next/image";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image
              src="https://placehold.co/128x128.png"
              width={128}
              height={128}
              alt="NexusServ 360 Logo"
              className="mx-auto mb-4 rounded-2xl border border-primary/50 bg-card p-2 shadow-[0_0_20px_theme(colors.primary.DEFAULT)]"
              data-ai-hint="isometric schematic"
          />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
            Restablecer Contraseña
          </h1>
          <p className="mt-2 text-muted-foreground">
            Ingrese su email para restablecer su contraseña de NexusServ 360.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
