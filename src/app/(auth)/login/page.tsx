// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";
import { getSettings } from "@/lib/actions/settings.actions";
import type { Configurations } from "@/types";

export default async function LoginPage() {
  let settings: Configurations | null = null;
  try {
    settings = await getSettings();
  } catch (error) {
    console.error("Failed to load settings for login page:", error);
    // Continue with default/placeholder values
  }

  const companyName = settings?.companyName || "JO-SERVICE Tech Manager";
  const logoUrl = settings?.companyLogoUrl || "https://placehold.co/150x50.png?text=JO-SERVICE";


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
           <Image 
            src={logoUrl}
            alt={`${companyName} Logo`}
            width={150} 
            height={50}
            className="mx-auto mb-6"
            data-ai-hint="company logo"
            priority // Prioritize loading logo on login page
          />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
            {companyName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Bienvenido. Por favor, inicie sesión.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
