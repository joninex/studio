// src/components/print/PrintableOrder.tsx
"use client";

import type { Order, Branch, Checklist } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { CHECKLIST_ITEMS, DEFAULT_STORE_SETTINGS } from "@/lib/constants";

interface PrintableOrderProps {
  order: Order;
  branch: Branch | null;
}

export function PrintableOrder({ order, branch }: PrintableOrderProps) {
  const settings = branch?.settings || DEFAULT_STORE_SETTINGS;

  const getChecklistValueDisplay = (value: 'si' | 'no' | 'sc' | string | undefined) => {
    if (value === 'si') return "✅ Sí";
    if (value === 'no') return "❌ No";
    if (value === 'sc') return "🟡 S/C"; // Sin Comprobar
    if (value) return value;
    return 'N/A';
  }

  const PageOne = () => (
    <div className="font-sans text-xs text-black bg-white p-8 min-h-[29.7cm] flex flex-col">
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
            <h1 className="font-bold text-base">{settings?.companyName || "Nombre de la Tienda"}</h1>
            <p className="text-[9pt]">{settings?.companyAddress || "Dirección no especificada"}</p>
            <p className="text-[9pt]">{settings?.companyContactDetails || "Contacto no especificado"}</p>
            <p className="text-[9pt]">CUIT: {settings?.companyCuit || "N/A"}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <h2 className="font-bold text-xl">Orden de Recepción Técnica</h2>
          <p className="font-mono text-lg mt-2">N° Orden: {order.orderNumber}</p>
          <p>Fecha: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </header>

      <main className="flex-grow">
        <section className="grid grid-cols-2 gap-4 my-4 text-[9pt]">
          <div className="border border-gray-300 p-2 rounded space-y-1">
            <h3 className="font-bold border-b pb-1 mb-1">Datos del Cliente</h3>
            <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
            <p><strong>DNI:</strong> {order.clientId || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {order.clientPhone || 'N/A'}</p>
          </div>
          <div className="border border-gray-300 p-2 rounded space-y-1">
            <h3 className="font-bold border-b pb-1 mb-1">Datos del Equipo</h3>
            <p><strong>Marca/Modelo:</strong> {order.deviceBrand} {order.deviceModel}</p>
            <p><strong>IMEI/Serial:</strong> {order.imeiNotVisible ? "No visible al ingreso" : order.deviceIMEI}</p>
            <p><strong>Accesorios:</strong> {order.accessories || "Ninguno"}</p>
          </div>
        </section>

        <section className="my-4 text-[9pt]">
          <h3 className="font-bold border-b pb-1 mb-1">Falla Declarada por el Cliente</h3>
          <p className="p-2 border bg-gray-50 rounded min-h-[40px]">{order.declaredFault || "N/A"}</p>
        </section>

        <section className="my-4 text-[9pt] break-inside-avoid">
          <h3 className="font-bold border-b pb-1 mb-2">Checklist Técnico de Ingreso</h3>
          <div className="text-[8pt] text-gray-600 mb-2">
            <p><strong>Significado:</strong> ✅ Sí (Funciona) | ❌ No (Falla) | 🟡 S/C (Sin Comprobar por falta de acceso/energía)</p>
          </div>
          <div className="columns-2 gap-x-6">
            {CHECKLIST_ITEMS.map(item => (
              <div key={item.id} className="flex justify-between text-xs border-b border-dotted py-0.5 break-inside-avoid">
                <span>{item.label}:</span>
                <span className="font-bold">{getChecklistValueDisplay(order.checklist[item.id as keyof Checklist])}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="my-4 text-[9pt]">
            <h3 className="font-bold border-b pb-1 mb-1">Daños y Observaciones Adicionales</h3>
            <p className="p-2 border bg-gray-50 rounded min-h-[40px]">{order.damageRisk || "Sin daños pre-existentes reportados."}</p>
        </section>

      </main>

      <footer className="mt-auto pt-4 border-t-2 border-dashed border-gray-400 space-y-4 text-[8pt]">
        <div className="leading-tight text-justify">
          <h3 className="font-bold text-center mb-1">Cláusula de Conformidad de Ingreso</h3>
          <p>{settings.intakeConformityText}</p>
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
        <div className="text-center text-gray-500 text-[7pt] pt-2">
          Uso Interno del Taller - No válido como comprobante de retiro.
        </div>
      </footer>
    </div>
  );

  const PageTwo = () => (
     <div className="font-sans text-xs text-black bg-white p-8 min-h-[29.7cm] flex flex-col">
        <header className="flex justify-between items-start pb-4 border-b border-gray-400">
          <div className="flex items-center gap-4">
            {settings?.companyLogoUrl ? (
              <Image src={settings.companyLogoUrl} alt={`${settings.companyName || ''} Logo`} width={120} height={40} className="object-contain" data-ai-hint="company logo" />
            ) : (
              <div className="w-[120px] h-[40px] bg-gray-200 flex items-center justify-center"><span className="text-gray-500 text-sm">Logo</span></div>
            )}
            <div>
              <h1 className="font-bold text-lg">{settings?.companyName || "Nombre de la Tienda"}</h1>
              <p>{settings?.companyAddress || "Dirección no especificada"}</p>
              <p>{settings?.companyContactDetails || "Contacto no especificado"}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <h2 className="font-bold text-xl">Comprobante para Cliente</h2>
            <p className="font-mono text-lg mt-2">N° Orden: {order.orderNumber}</p>
            <p>Fecha Ingreso: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </header>

        <main className="flex-grow my-6">
            <section className="grid grid-cols-2 gap-6 text-sm">
                <div>
                    <h3 className="font-bold border-b pb-1 mb-2">Cliente</h3>
                    <p>{order.clientName || 'N/A'} {order.clientLastName || ''}</p>
                    <p>DNI: {order.clientId || 'N/A'}</p> 
                </div>
                <div>
                    <h3 className="font-bold border-b pb-1 mb-2">Equipo</h3>
                    <p><strong>Dispositivo:</strong> {order.deviceBrand} {order.deviceModel}</p>
                    <p><strong>IMEI/Serial:</strong> {order.imeiNotVisible ? "Pendiente de registrar" : order.deviceIMEI}</p>
                    <p><strong>Accesorios:</strong> {order.accessories || "Ninguno"}</p>
                </div>
            </section>
            <section className="my-6 text-sm">
                <h3 className="font-bold border-b pb-1 mb-2">Falla Declarada</h3>
                <p className="p-2 border bg-gray-50 rounded-md min-h-[40px]">{order.declaredFault || "N/A"}</p>
            </section>
             <section className="my-6 text-sm">
                <h3 className="font-bold border-b pb-1 mb-2">Estado Actual</h3>
                <p className="text-lg font-semibold text-primary">{order.status}</p>
            </section>
        </main>
        
        <footer className="mt-auto pt-4 border-t-2 border-dashed border-gray-400 space-y-4">
            <div className="text-[10pt] text-center font-bold border-2 border-black p-2 rounded-md">
                <p>IMPORTANTE: CONSERVE ESTE COMPROBANTE PARA RETIRAR SU EQUIPO</p>
            </div>
            <div className="text-[8pt] leading-tight">
                <h3 className="font-bold text-center mb-2">Términos y Condiciones de Servicio</h3>
                <p className="text-justify">{settings.clientVoucherLegalReminder}</p>
            </div>
             <div className="flex justify-around items-end gap-12 pt-16">
                <div className="flex-1 text-center">
                    <div className="border-t-2 border-black pt-1">Firma del Cliente al Retirar</div>
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

  return (
    <>
      <PageOne />
      <div className="page-break"></div>
      <PageTwo />
    </>
  );
}
