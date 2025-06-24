// src/components/dashboard/DashboardClientView.tsx
"use client";

import type { Order, User } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { AdminDashboard } from "./AdminDashboard";
import { TechnicianDashboard } from "./TechnicianDashboard";
import { ReceptionistDashboard } from "./ReceptionistDashboard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface DashboardClientViewProps {
  allOrders: Order[];
  allUsers: User[];
}

export function DashboardClientView({ allOrders, allUsers }: DashboardClientViewProps) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard allOrders={allOrders} allUsers={allUsers} />;
    case 'tecnico':
      return <TechnicianDashboard allOrders={allOrders} currentUser={user} />;
    case 'recepcionista':
       return <ReceptionistDashboard allOrders={allOrders} />;
    default:
      return (
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold">Rol no reconocido</h2>
          <p className="text-muted-foreground">No hay un dashboard disponible para su tipo de usuario.</p>
        </div>
      );
  }
}
