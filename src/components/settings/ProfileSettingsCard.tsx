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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";


interface ProfileSettingsCardProps {
  user: User;
}

export function ProfileSettingsCard({ user: initialUser }: ProfileSettingsCardProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof ProfileUpdateSchema>>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      name: initialUser.name || "",
      avatarUrl: initialUser.avatarUrl || "",
    },
  });

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
        if (typeof window !== 'undefined') {
            localStorage.setItem('authUser', JSON.stringify(result.user));
            window.dispatchEvent(new CustomEvent('authChange'));
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message || "No se pudo actualizar el perfil." });
      }
    });
  };
  
  const avatarUrl = form.watch("avatarUrl");

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ImageUpload
              label="Avatar de Usuario"
              placeholderImage={`https://i.pravatar.cc/150?u=${initialUser.uid}`}
              aiHint="user profile large avatar"
              currentImageUrl={avatarUrl}
              onUploadComplete={(path) => {
                form.setValue('avatarUrl', path, { shouldValidate: true });
              }}
              imageClassName="rounded-full h-32 w-32 object-cover"
            />
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
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || authLoading} className="w-full sm:w-auto">
                {(isPending || authLoading) && <LoadingSpinner size={16} className="mr-2"/>}
                Guardar Cambios en Perfil
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
