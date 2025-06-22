// src/app/(app)/dashboard/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkOrderDashboard } from "@/components/dashboard/WorkOrderDashboard";

export default function DashboardPage() {
  const userName = "Admin"; // Placeholder, replace with actual user data logic
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${userName}!`}
        description="Resumen general de la actividad de su taller."
      />
      <WorkOrderDashboard />
    </div>
  );
}
