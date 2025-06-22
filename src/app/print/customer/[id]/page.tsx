// src/app/print/customer/[id]/page.tsx
import { getOrderById } from "@/lib/actions/order.actions";
import { getBranchById } from "@/lib/actions/branch.actions";
import { notFound } from "next/navigation";
import ClientPrintButton from "./ClientPrintButton";
import type { Branch } from "@/types";
import { PrintableCustomerVoucher } from "@/components/print/PrintableCustomerVoucher";

export const revalidate = 0; // Revalidate on every request

interface CustomerPrintPageProps {
  params: { id: string };
}

export default async function CustomerPrintPage({ params }: CustomerPrintPageProps) {
  const orderId = params.id;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  const branch = await getBranchById(order.branchId);

  if (!branch) {
      console.error(`Branch with ID ${order.branchId} not found for Order ${order.id}`);
  }

  return (
    <div className="bg-gray-200 min-h-screen p-4 sm:p-8 printable-area-wrapper">
      <title>Comprobante_Cliente_OR-{order.orderNumber}.pdf</title>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-2 sm:p-4 rounded-md shadow-lg no-print mb-4 flex justify-end">
           <ClientPrintButton />
        </div>
        <div className="printable-area bg-white shadow-lg">
            <PrintableCustomerVoucher order={order} branch={branch as Branch | null} />
        </div>
      </div>
    </div>
  );
}
