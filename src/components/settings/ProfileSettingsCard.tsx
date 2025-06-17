// src/components/settings/ProfileSettingsCard.tsx
"use client";

import { useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import type { User } from "@/types";
import { ProfileUpdateSchema } from "@/lib/schemas";
import { updateUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";


interface ProfileSettingsCardProps {
  user: User;
}

export function ProfileSettingsCard({ user: initialUser }: ProfileSettingsCardProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth(); // Get live user state from auth provider

  const form = useForm<z.infer<typeof ProfileUpdateSchema>>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      name: initialUser.name || "",
      avatarUrl: initialUser.avatarUrl || "",
    },
  });

  // Effect to reset form if the user prop changes (e.g., after a successful update from AuthProvider)
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, form]);


  const onSubmit = (values: z.infer<typeof ProfileUpdateSchema>) => {
    if (!initialUser) return;

    startTransition(async () => {
      const result = await updateUser(initialUser.uid, {
        name: values.name,
        avatarUrl: values.avatarUrl,
      });

      if (result.success && result.user) {
        toast({ title: "Éxito", description: "Perfil actualizado correctamente." });
        // The AuthProvider should pick up changes to localStorage if updateUser also updates it
        // For direct feedback, we can re-trigger auth state or rely on useEffect above
        if (typeof window !== 'undefined') {
            localStorage.setItem('authUser', JSON.stringify(result.user));
            window.dispatchEvent(new CustomEvent('authChange'));
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message || "No se pudo actualizar el perfil." });
      }
    });
  };
  
  const currentAvatarUrl = form.watch("avatarUrl");

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-primary" />
          Mi Perfil
        </CardTitle>
        <CardDescription>Actualice su nombre y foto de perfil.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage 
              src={currentAvatarUrl || (initialUser.uid ? `https://i.pravatar.cc/150?u=${initialUser.uid}` : "https://placehold.co/100x100.png")} 
              alt={initialUser.name} 
              data-ai-hint="user profile large avatar"
            />
            <AvatarFallback className="text-3xl">{initialUser.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Su nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><ImageIcon className="h-4 w-4"/> URL de su Avatar</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://ejemplo.com/su-avatar.png" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Ingrese la URL completa de la imagen que desea usar como avatar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending || authLoading} className="w-full sm:w-auto">
              {(isPending || authLoading) && <LoadingSpinner size={16} className="mr-2"/>}
              Guardar Cambios en Perfil
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
