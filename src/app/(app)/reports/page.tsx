// src/app/(app)/reports/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartBig, Info } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Reportes"
        description="Visualice análisis y métricas clave de su taller."
      />
      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-amber-500" />Funcionalidad en Desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center text-center py-12">
                <BarChartBig className="h-20 w-20 text-primary/50 mb-6" />
                <h2 className="text-2xl font-semibold text-primary mb-2">Próximamente: Reportes Detallados</h2>
                <p className="text-muted-foreground max-w-md">
                    Estamos trabajando para ofrecerle una completa central de reportes que le permitirá analizar:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-4 text-left max-w-sm mx-auto">
                    <li>Rendimiento por técnico.</li>
                    <li>Análisis de rentabilidad por tipo de reparación.</li>
                    <li>Uso y rotación de repuestos.</li>
                    <li>Tiempos promedio de reparación.</li>
                    <li>Y mucho más...</li>
                </ul>
                {/* Optional: Add a concluding remark if desired, e.g.,
                <p className="text-muted-foreground mt-6">
                    ¡Vuelva pronto para más actualizaciones!
                </p>
                */}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
