// src/app/(app)/ai-guides/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { getProcedureSteps, type GetProcedureStepsOutput } from "@/ai/flows/get-procedure-steps";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Bot, Lightbulb, Wrench, CheckSquare, AlertTriangle, List } from "lucide-react";

const FormSchema = z.object({
  procedureName: z.string().min(5, {
    message: "Por favor, ingrese un nombre de procedimiento descriptivo (mín. 5 caracteres).",
  }),
});

export default function AiGuidesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [procedureData, setProcedureData] = useState<GetProcedureStepsOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      procedureName: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setProcedureData(null);
    try {
      const result = await getProcedureSteps({ procedureName: data.procedureName });
      setProcedureData(result);
    } catch (error) {
      console.error("Error fetching procedure steps:", error);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: "No se pudo generar la guía. Por favor, intente de nuevo más tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guías de Reparación Asistidas por IA"
        description="Obtenga procedimientos paso a paso, herramientas necesarias y notas importantes para cualquier reparación."
      />
      
      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/>Generar Nueva Guía</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={form.control}
                name="procedureName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Nombre del Procedimiento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Reemplazo de pantalla de iPhone 14 Pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto mt-auto">
                {isLoading ? <LoadingSpinner size={16} className="mr-2"/> : <Bot className="mr-2 h-4 w-4" />}
                {isLoading ? "Generando..." : "Obtener Guía"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <LoadingSpinner size={48} />
            <p className="text-muted-foreground mt-4 font-semibold">El asistente IA está redactando la guía...</p>
            <p className="text-sm text-muted-foreground">Esto puede tomar unos segundos.</p>
        </div>
      )}

      {procedureData && (
        <Card className="shadow-xl animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">{procedureData.procedureTitle}</CardTitle>
            <CardDescription>Guía generada por IA para el procedimiento solicitado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Wrench/>Herramientas Requeridas</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {procedureData.toolsRequired.map((tool, index) => <li key={index}>{tool}</li>)}
                    </ul>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><AlertTriangle/>Notas Importantes</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {procedureData.importantNotes.map((note, index) => <li key={index}>{note}</li>)}
                    </ul>
                </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><List/>Pasos del Procedimiento</h3>
              <ol className="list-decimal list-inside space-y-3">
                {procedureData.steps.map((step, index) => (
                  <li key={index} className="pl-2 border-l-2 border-primary/20">
                    <p className="font-medium text-primary-foreground/90">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

          </CardContent>
        </Card>
      )}

    </div>
  );
}
