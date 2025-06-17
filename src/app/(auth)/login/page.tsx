// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
           <Image 
            src="https://placehold.co/150x50.png?text=JO-SERVICE" // Placeholder for logo
            alt="JO-SERVICE Logo" 
            width={150} 
            height={50}
            className="mx-auto mb-6"
            data-ai-hint="company logo"
          />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
            JO-SERVICE Tech Manager
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
