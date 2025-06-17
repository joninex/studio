// src/components/shared/PrintableView.tsx
"use client";

import type { Order } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CHECKLIST_ITEMS } from "@/lib/constants";
import Image from "next/image";

interface PrintableViewProps {
  order: Order;
}

export function PrintableView({ order }: PrintableViewProps) {
  // This component is only visible during printing due to CSS in globals.css or a print-specific stylesheet.
  // We'll add a simple style here for demonstration.
  // In globals.css, you would add:
  // @media print {
  //   .printable-area { display: block !important; }
  //   body > *:not(.printable-area) { display: none !important; }
  // }
  // .printable-area { display: none; }
  // For simplicity, we make this part of the main OrderDetailClient component and control its visibility with a class `print-container`.
  // Then use @media print to style .print-container and hide other elements.
  // The structure below is what should be rendered FOR PRINTING.
  // It's part of the OrderDetailClient's render for easy data access.
  // This separate component can be useful if print layout is very different.
  // For now, it's illustrative and the main print logic is within OrderDetailClient's structure.

  // The actual print styles will be applied via CSS targeting the main view elements.
  // So, this component acts more as a structural guide or could be used if we wanted a *completely different* layout for print.
  // For the current request, the main detail view will be printed.
  // To avoid confusion, let's make this a minimal structure and assume print CSS handles the rest from main view.
  // Alternatively, the main component ITSELF is the "PrintableView" if styled correctly with @media print.

  // This component is better suited to be dynamically rendered by a print library.
  // Since we are using window.print(), the main content IS the printable view.
  // This file serves as a placeholder or example if a library like react-to-print were to render a specific component.
  // The approach of styling the main OrderDetailClient component using @media print is more direct.

  // The className "hidden print:block" could be used on a dedicated print section.
  // The provided solution styles the existing OrderDetailClient output for printing.
  // This file is thus not strictly necessary for the current print implementation but can be kept for reference.

  return (
    <div className="hidden print:block p-8 font-sans">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact; /* Chrome, Safari */
            color-adjust: exact; /* Firefox */
          }
          .no-print {
            display: none !important;
          }
           /* Ensure cards don't break across pages badly */
          .card-print {
            page-break-inside: avoid;
            border: 1px solid #ccc; /* Simple border for print */
            margin-bottom: 1rem;
            padding: 1rem;
          }
          h1, h2, h3, h4, strong {
            color: #000 !important; /* Ensure text is black for print */
          }
          .print-badge {
            border: 1px solid #000;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            display: inline-block;
            margin-left: 0.5rem;
          }
        }
      `}</style>
      <div className="text-center mb-8">
        <Image 
            src="https://placehold.co/200x75.png?text=JO-SERVICE"
            alt="JO-SERVICE Logo"
            width={200}
            height={75}
            className="mx-auto mb-4"
            data-ai-hint="company logo"
        />
        <h1 className="text-2xl font-bold">Orden de Servicio: {order.orderNumber}</h1>
        <p>Fecha de Ingreso: {format(new Date(order.entryDate), "dd MMMM yyyy, HH:mm", { locale: es })}</p>
        <p>Estado: <span className="print-badge">{order.status}</span></p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 card-print">
        <div>
          <h2 className="text-lg font-semibold mb-2">Datos del Cliente</h2>
          <p><strong>Nombre:</strong> {order.clientName} {order.clientLastName}</p>
          <p><strong>DNI:</strong> {order.clientDni}</p>
          <p><strong>Teléfono:</strong> {order.clientPhone}</p>
          <p><strong>Email:</strong> {order.clientEmail || "N/A"}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Datos del Equipo</h2>
          <p><strong>Marca:</strong> {order.deviceBrand}</p>
          <p><strong>Modelo:</strong> {order.deviceModel}</p>
          <p><strong>IMEI:</strong> {order.deviceIMEI}</p>
          <p><strong>Falla Declarada:</strong> {order.declaredFault}</p>
          <p><strong>Clave/Patrón:</strong> {order.unlockPatternInfo}</p>
        </div>
      </div>

      <div className="mb-6 card-print">
        <h2 className="text-lg font-semibold mb-2">Checklist de Recepción</h2>
        <ul className="list-disc list-inside grid grid-cols-2 gap-x-4">
          {CHECKLIST_ITEMS.map(item => (
            <li key={item.id}>
              {item.label}: <span className="font-medium">{order.checklist[item.id] === 'si' ? 'Sí' : 'No'}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mb-6 card-print">
         <h2 className="text-lg font-semibold mb-2">Riesgos y Observaciones</h2>
         <p><strong>Riesgo de Rotura:</strong> {order.damageRisk || "Ninguno"}</p>
         <p><strong>Sectores Específicos:</strong> {order.specificSectors.join(", ") || "Ninguno"}</p>
         <p><strong>Observaciones Adicionales:</strong> {order.observations || "Ninguna"}</p>
      </div>


      <div className="mb-6 card-print">
        <h2 className="text-lg font-semibold mb-2">Costos</h2>
        <p><strong>Repuesto:</strong> ${order.costSparePart.toFixed(2)}</p>
        <p><strong>Mano de Obra:</strong> ${order.costLabor.toFixed(2)}</p>
        <p><strong>Pendiente:</strong> ${order.costPending.toFixed(2)}</p>
        <p className="mt-2 text-lg"><strong>Total Estimado (Repuesto + Mano Obra):</strong> ${(order.costSparePart + order.costLabor).toFixed(2)}</p>
      </div>

      <div className="mt-8 pt-4 border-t">
        <p className="text-sm"><strong>Aceptado por:</strong> {order.customerSignatureName}</p>
        <p className="text-sm"><strong>Fecha de Aceptación:</strong> {format(new Date(order.entryDate), "dd MMMM yyyy", { locale: es })}</p>
        <div className="mt-4 h-20 border w-full max-w-xs" aria-label="Espacio para firma del cliente">
          <p className="text-xs text-center pt-1 text-gray-500">Firma del Cliente</p>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-gray-700">
        <h3 className="font-semibold mb-1">Condiciones de Garantía y Retiro:</h3>
        {/* These would be fetched from Configurations in a real app */}
        <p className="mb-2">La garantía cubre únicamente la reparación efectuada. No cubre fallas preexistentes o nuevas fallas no relacionadas con la reparación original. La garantía es de 90 días.</p>
        <p>El equipo debe ser retirado dentro de los 30 días posteriores a la notificación de "Listo para Retirar". Pasado dicho plazo, se aplicarán cargos por almacenamiento. Equipos no retirados luego de 60/90 días (según política) podrán ser declarados en abandono.</p>
        <p className="mt-2"><strong>{order.branchInfo}</strong> - Contacto: (Número de teléfono/email)</p>
      </div>
    </div>
  );
}
