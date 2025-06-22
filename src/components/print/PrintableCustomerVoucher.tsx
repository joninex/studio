// src/components/print/PrintableCustomerVoucher.tsx
"use client";

import type { Order, Branch, Checklist } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { CHECKLIST_ITEMS, DEFAULT_STORE_SETTINGS } from "@/lib/constants";

interface PrintableCustomerVoucherProps {
  order: Order;
  branch: Branch | null;
}

export function PrintableCustomerVoucher({ order, branch }: PrintableCustomerVoucherProps) {
  const settings = branch?.settings || DEFAULT_STORE_SETTINGS;

  const getChecklistValueDisplay = (value: 'si' | 'no' | 'sc' | string | undefined) => {
    if (value === 'si') return "✅ Sí";
    if (value === 'no') return "❌ No";
    if (value === 'sc') return "🟡 No comprobado";
    if (value) return value;
    return 'N/A';
  }

  return (
    <div className="font-sans text-xs text-black bg-white p-8 flex flex-col min-h-[26cm]">
        <main className="flex-grow">
            {/* Header */}
            <header className="flex justify-between items-start pb-4 border-b border-gray-400">
                <div className="flex items-center gap-4">
                {settings?.companyLogoUrl ? (
                    <Image
                    src={settings.companyLogoUrl}
                    alt={`${settings.companyName || ''} Logo`}
                    width={120}
                    height={40}
                    className="object-contain"
                    data-ai-hint="company logo"
                    />
                ) : (
                    <div className="w-[120px] h-[40px] bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Logo</span>
                    </div>
                )}
                <div>
                    <h1 className="font-bold text-lg">{settings?.companyName || "Nombre de la Tienda"}</h1>
                    <p>{settings?.companyAddress || "Dirección no especificada"}</p>
                    <p>{settings?.companyContactDetails || "Contacto no especificado"}</p>
                </div>
                </div>
                <div className="text-right shrink-0">
                    <h2 className="font-bold text-xl">Comprobante de Retiro</h2>
                    <p className="font-mono text-base mt-2">N° Orden: {order.orderNumber}</p>
                    <p>Fecha de Ingreso: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm")}</p>
                    <p className="font-bold">Estado Actual: {order.status}</p>
                </div>
            </header>

            {/* Customer & Device Info */}
            <section className="grid grid-cols-2 gap-6 my-4 text-sm">
                <div className="space-y-1">
                    <h3 className="font-bold border-b pb-1 mb-2">Datos del Cliente</h3>
                    <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
                    <p><strong>DNI:</strong> {order.clientId || 'N/A'}</p> 
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold border-b pb-1 mb-2">Datos del Equipo</h3>
                    <p><strong>Marca/Modelo:</strong> {order.deviceBrand} {order.deviceModel}</p>
                    <p><strong>IMEI/Serial:</strong> {order.deviceIMEI || 'Pendiente de registrar'}</p>
                </div>
            </section>
            
            {/* Fault & Diagnosis */}
            <section className="space-y-3 my-4 text-sm">
                 <div>
                    <h3 className="font-bold">Falla Declarada por el Cliente</h3>
                    <p className="p-2 border bg-gray-50 rounded-md min-h-[40px]">{order.declaredFault || "N/A"}</p>
                </div>
                <div>
                    <h3 className="font-bold">Diagnóstico y Observaciones del Técnico</h3>
                    <p className="p-2 border bg-gray-50 rounded-md min-h-[40px]">{order.observations || "Sin observaciones adicionales."}</p>
                </div>
            </section>

            {/* Intake Checklist Summary */}
            <section className="my-4 text-sm break-inside-avoid">
                <h3 className="font-bold border-b pb-1 mb-2">Resumen del Estado de Ingreso</h3>
                <div className="columns-2 gap-x-6">
                {CHECKLIST_ITEMS.map(item => (
                    <div key={item.id} className="flex justify-between text-xs border-b border-dotted py-0.5">
                        <span>{item.label}:</span>
                        <span className="font-bold">{getChecklistValueDisplay(order.checklist[item.id as keyof Checklist])}</span>
                    </div>
                ))}
                </div>
            </section>
        </main>
        {/* Legal Terms & Signature */}
        <footer className="mt-auto pt-4 border-t-2 border-dashed border-gray-400 space-y-4 text-xs">
            <div className="text-[8pt] leading-tight">
                <h3 className="font-bold text-center mb-2">Términos y Condiciones de Retiro</h3>
                <p className="text-justify">{settings.warrantyConditions}</p>
                <p className="text-justify mt-1">{settings.pickupConditions}</p>
                 <p className="text-justify mt-1">{settings.warrantyVoidConditionsText}</p>
            </div>
            <div className="text-center font-bold">
                <p>Declaro haber recibido el equipo detallado en las condiciones mencionadas y estoy de acuerdo con el trabajo realizado.</p>
            </div>
            <div className="flex justify-around items-end gap-12 pt-16">
                <div className="flex-1 text-center">
                    <div className="border-t-2 border-black pt-1">Firma del Cliente</div>
                </div>
                <div className="flex-1 text-center">
                    <div className="border-t-2 border-black pt-1">Aclaración</div>
                </div>
                <div className="flex-1 text-center">
                    <div className="border-t-2 border-black pt-1">DNI</div>
                </div>
            </div>
        </footer>
    </div>
  );
}
