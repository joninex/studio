
"use client";

import WorkOrderDashboard from '@/components/dashboard/WorkOrderDashboard';

// Removed PageHeader and other imports as WorkOrderDashboard is self-contained.
// Removed useAuth and data fetching logic as WorkOrderDashboard handles its own data (currently static).

export default function DashboardPage() {
  // The existing PageHeader is removed because the new WorkOrderDashboard
  // component includes its own header and page title structure.
  // The auth information (user?.name) previously used in PageHeader
  // would need to be integrated into WorkOrderDashboard if needed there.
  return <WorkOrderDashboard />;
}
