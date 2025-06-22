// src/app/print/customer/[id]/ClientPrintButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function ClientPrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Imprimir Comprobante
    </Button>
  );
}
