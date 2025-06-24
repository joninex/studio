// src/app/(app)/dashboard/page.tsx
import { getOrders } from "@/lib/actions/order.actions";
import { getUsers } from "@/lib/actions/user.actions";
import { getBranches } from "@/lib/actions/branch.actions";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { PageHeader } from "@/components/shared/PageHeader";

export const revalidate = 0;

export default async function DashboardPage() {
  // Pre-fetching all data on the server to pass down to the client-side router component.
  // This is more efficient than each client component fetching its own data.
  const allOrders = await getOrders();
  const allUsers = await getUsers();
  const allBranches = await getBranches();

  return (
    <div className="space-y-6">
       <PageHeader
        title="Dashboard"
        description="Resumen de la actividad relevante para su rol."
      />
      <Suspense fallback={<div className="flex h-full items-center justify-center"><LoadingSpinner size={48} /></div>}>
        <DashboardClientView allOrders={allOrders} allUsers={allUsers} allBranches={allBranches} />
      </Suspense>
    </div>
  );
}
