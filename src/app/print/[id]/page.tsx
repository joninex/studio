// src/app/print/[id]/page.tsx
import { getOrderById } from "@/lib/actions/order.actions";
import { getBranchById } from "@/lib/actions/branch.actions";
import { notFound } from "next/navigation";
import { PrintableOrder } from "@/components/print/PrintableOrder";
import ClientPrintButton from "./ClientPrintButton";
import type { Branch } from "@/types";

export const revalidate = 0; // Revalidate on every request

interface PrintPageProps {
  params: { id: string };
}

export default async function PrintPage({ params }: PrintPageProps) {
  const orderId = params.id;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  const branch = await getBranchById(order.branchId);

  if (!branch) {
      // Handle case where branch is not found, maybe show an error or use default data
      // For now, we'll proceed but the PrintableOrder component must handle a null branch
      console.error(`Branch with ID ${order.branchId} not found for Order ${order.id}`);
  }

  return (
    <div className="bg-gray-200 min-h-screen p-4 sm:p-8 printable-area-wrapper">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-2 sm:p-4 rounded-md shadow-lg no-print mb-4 flex justify-end">
           <ClientPrintButton />
        </div>
        <div className="printable-area bg-white shadow-lg">
            <PrintableOrder order={order} branch={branch as Branch} />
        </div>
      </div>
    </div>
  );
}
