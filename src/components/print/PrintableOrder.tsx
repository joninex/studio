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
    if (value === 'sc') return "🟡 No comprobado";
    if (value) return value;
    return 'N/A';
  }
  
  const checklistGroups = CHECKLIST_ITEMS.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {} as Record<string, typeof CHECKLIST_ITEMS>);


  const PageOne = () => (
    <div className="print-page">
      <header className="print-header">
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
            <div className="w-[120px] h-[40px] flex items-center justify-center">
              <span className="text-gray-500 text-sm font-bold">{settings.companyName}</span>
            </div>
          )}
          <div>
            <h1 className="font-bold text-base">{settings.companyName}</h1>
            <p className="text-[9pt]">{settings.companyAddress}</p>
            <p className="text-[9pt]">{settings.companyContactDetails}</p>
            <p className="text-[9pt]">CUIT: {settings.companyCuit || "N/A"}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-bold text-xl">Orden de Recepción Técnica</h2>
          <p className="font-mono text-lg mt-2">N° Orden: {order.orderNumber}</p>
          <p>Fecha: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm", { locale: es })}</p>
        </div>
      </header>

      <main className="print-main">
        {/* Client & Device Data */}
        <section className="print-section grid grid-cols-2 gap-4">
          <div>
            <h3 className="section-title">Datos del Cliente</h3>
            <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
            <p><strong>DNI:</strong> {order.clientId || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {order.clientPhone || 'N/A'}</p>
          </div>
          <div>
            <h3 className="section-title">Datos del Equipo</h3>
            <p><strong>Marca/Modelo:</strong> {order.deviceBrand} {order.deviceModel}</p>
            <p><strong>IMEI/Serial:</strong> {order.imeiNotVisible ? "No visible al ingreso" : order.deviceIMEI}</p>
            <p><strong>Accesorios:</strong> {order.observations || "Ninguno"}</p>
          </div>
        </section>

        {/* Declared Fault */}
        <section className="print-section">
          <h3 className="section-title">Falla Declarada por el Cliente</h3>
          <p className="p-2 min-h-[40px]">{order.declaredFault || "N/A"}</p>
        </section>

        {/* Intake Checklist */}
        <section className="print-section">
          <h3 className="section-title">Checklist Técnico de Ingreso</h3>
           <div className="text-[8pt] text-gray-600 mb-2">
            <strong>Significado:</strong> ✅ Sí (Funciona) | ❌ No (Falla) | 🟡 S/C (Sin Comprobar por falta de acceso/energía)
          </div>
          {Object.entries(checklistGroups).map(([groupName, items]) => (
            <div key={groupName} className="mb-2 break-inside-avoid">
              <h4 className="font-bold text-gray-700">{groupName}</h4>
              <div className="columns-2 gap-x-6">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs py-0.5 border-b border-dotted">
                    <span>{item.label}:</span>
                    <span className="font-semibold">{getChecklistValueDisplay(order.checklist[item.id as keyof Checklist])}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Damage & Observations */}
        <section className="print-section">
            <h3 className="section-title">Daños y Observaciones Adicionales</h3>
            <p className="p-2 min-h-[40px]">{order.damageRisk || "Sin daños pre-existentes reportados."}</p>
        </section>

        {/* Legal Disclaimer for Unlock */}
        {!order.unlockPatternProvided && (
            <section className="print-section border-2 border-red-500 p-2 text-red-700">
                <h3 className="section-title text-red-700">¡ATENCIÓN! Equipo Sin Código de Desbloqueo</h3>
                <p className="text-xs">{DEFAULT_STORE_SETTINGS.noUnlockCodeDisclaimer}</p>
            </section>
        )}
      </main>

      <footer className="print-footer space-y-2">
        <div className="text-[8pt] leading-tight text-justify">
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
          Uso Interno del Taller
        </div>
      </footer>
    </div>
  );

  const PageTwo = () => (
     <div className="print-page">
        <header className="print-header">
          <div className="flex items-center gap-4">
            {settings?.companyLogoUrl ? (
              <Image src={settings.companyLogoUrl} alt={`${settings.companyName || ''} Logo`} width={120} height={40} className="object-contain" data-ai-hint="company logo" />
            ) : (
              <div className="w-[120px] h-[40px] flex items-center justify-center">
                <span className="text-gray-500 text-sm font-bold">{settings.companyName}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <h2 className="font-bold text-xl">Comprobante para Cliente</h2>
            <p className="font-mono text-lg mt-2">N° Orden: {order.orderNumber}</p>
            <p>Fecha Ingreso: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm", { locale: es })}</p>
          </div>
        </header>

        <main className="print-main">
            <section className="print-section grid grid-cols-2 gap-4">
                <div>
                    <h3 className="section-title">Cliente</h3>
                    <p>{order.clientName || 'N/A'} {order.clientLastName || ''}</p>
                    <p>DNI: {order.clientId || 'N/A'}</p> 
                </div>
                <div>
                    <h3 className="section-title">Equipo</h3>
                    <p><strong>Dispositivo:</strong> {order.deviceBrand} {order.deviceModel}</p>
                    <p><strong>IMEI/Serial:</strong> {order.imeiNotVisible ? "Pendiente de registrar" : order.deviceIMEI}</p>
                </div>
            </section>
            
            <section className="print-section">
                <h3 className="section-title">Falla Declarada</h3>
                <p className="p-2 min-h-[40px]">{order.declaredFault || "N/A"}</p>
            </section>

             <section className="print-section">
                <h3 className="section-title">Estado Actual de la Orden</h3>
                <p className="text-lg font-semibold text-primary">{order.status}</p>
            </section>
        </main>
        
        <footer className="print-footer space-y-4">
            <div className="text-center font-bold border-2 border-black p-2 rounded-md">
                <p>IMPORTANTE: CONSERVE ESTE COMPROBANTE PARA RETIRAR SU EQUIPO</p>
            </div>
            <div className="text-[8pt] leading-tight">
                <h3 className="font-bold text-center mb-2">Términos y Condiciones de Servicio</h3>
                <p className="text-justify">{settings.clientVoucherLegalReminder}</p>
            </div>
             <div className="flex justify-around items-end gap-12 pt-16">
                <div className="flex-1 text-center">
                    <div className="border-t-2 border-black pt-1">Firma al Retirar</div>
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
