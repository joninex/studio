// src/components/print/PrintableOrder.tsx
"use client";

import type { Order, Branch, Checklist } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { CHECKLIST_ITEMS } from "@/lib/constants";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

interface PrintableOrderProps {
  order: Order;
  branch: Branch | null;
}

export function PrintableOrder({ order, branch }: PrintableOrderProps) {
  const settings = branch?.settings || DEFAULT_STORE_SETTINGS;
  const qrUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/orders/${order.id}` 
    : '';

  const totalCost = (order.costLabor || 0) + (order.costSparePart || 0);

  const checklistGroups = CHECKLIST_ITEMS.reduce((acc, item) => {
    const value = order.checklist?.[item.id as keyof Checklist];
    if (value) {
        (acc[item.group] = acc[item.group] || []).push({ ...item, value });
    }
    return acc;
  }, {} as Record<string, (typeof CHECKLIST_ITEMS[0] & { value: any })[]>);

  const getChecklistValueDisplay = (value: 'si' | 'no' | 'sc' | string | undefined) => {
    if (value === 'si') return "Sí";
    if (value === 'no') return "No";
    if (value === 'sc') return "S/C"; // Sin Comprobar
    if (value) return value;
    return 'N/A';
  }

  return (
    <div className="font-sans text-xs text-black bg-white p-8">
      {/* SECTION 1: INGRESO Y CONTRATO */}
      <section className="section-container">
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
            {settings?.companyLogoUrl && (
              <Image
                src={settings.companyLogoUrl}
                alt={`${settings.companyName || ''} Logo`}
                width={120}
                height={40}
                className="object-contain"
                data-ai-hint="company logo"
              />
            )}
            <div>
              <h1 className="font-bold text-lg">{settings?.companyName || "Nombre de la Tienda"}</h1>
              <p>{settings?.companyAddress || "Dirección no especificada"}</p>
              <p>{settings?.companyContactDetails || "Contacto no especificado"}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-xl">Orden de Reparación</h2>
            <p className="font-mono text-base">N°: {order.orderNumber}</p>
            <p>Fecha: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </header>

        {/* Client and Device Details */}
        <div className="grid grid-cols-2 gap-6 my-4">
          <div className="border border-gray-200 p-3 rounded">
            <h3 className="font-bold border-b border-gray-200 pb-1 mb-2">Datos del Cliente</h3>
            <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
            <p><strong>DNI:</strong> {order.clientId || 'N/A'}</p> {/* Assuming DNI is in clientId */}
            <p><strong>Teléfono:</strong> {order.clientName ? 'Obtenido de ficha' : 'N/A'}</p>
            <p><strong>Email:</strong> {order.clientName ? 'Obtenido de ficha' : 'N/A'}</p>
          </div>
          <div className="border border-gray-200 p-3 rounded">
            <h3 className="font-bold border-b border-gray-200 pb-1 mb-2">Datos del Dispositivo</h3>
            <p><strong>Tipo:</strong> Dispositivo Electrónico</p>
            <p><strong>Marca/Modelo:</strong> {order.deviceBrand} {order.deviceModel}</p>
            <p><strong>Color:</strong> {order.deviceColor || "No especificado"}</p>
            <p><strong>IMEI/Serial:</strong> {order.deviceIMEI}</p>
            <p><strong>Accesorios:</strong> {order.accessories || "Ninguno"}</p>
          </div>
        </div>
        
        {/* Fault and Observations */}
        <div className="border border-gray-200 p-3 rounded mb-4">
           <h3 className="font-bold border-b border-gray-200 pb-1 mb-2">Falla Reportada y Estado Inicial</h3>
           <p className="mb-2"><strong>Falla Reportada por el Cliente:</strong> {order.declaredFault || "No especificada"}</p>
           <p className="mb-2"><strong>Observaciones (Daños Visibles):</strong> {order.damageRisk || "Sin daños visibles reportados."}</p>
           
           <div className="mt-2 text-[8pt] p-2 bg-gray-50 rounded border border-gray-200">
            <p className="font-bold text-center mb-1">CHECKLIST TÉCNICO DE INGRESO - Estado Inicial</p>
            <p className="text-[7pt] text-center italic mb-2">Significado: ✅ "Sí" (Funciona/Presente), ❌ "No" (Falla/Ausente), 🟡 "S/C" (Sin Comprobar)</p>
             {Object.keys(checklistGroups).length > 0 ? (
                <div className="space-y-1">
                    {Object.entries(checklistGroups).map(([groupName, items]) => (
                        <div key={groupName}>
                            <p className="font-semibold text-[7pt] underline">{groupName}:</p>
                            <div className="grid grid-cols-2 gap-x-4">
                                {items.map(item => (
                                    <div key={item.id} className="border-b border-dotted flex justify-between">
                                        <span>{item.label}:</span>
                                        <span className="font-semibold">{getChecklistValueDisplay(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
             ) : (
                <p className="text-gray-500 text-center">No se completó el checklist de ingreso.</p>
             )}
           </div>

           <div className="mt-3 p-2 border border-dashed border-red-400 rounded text-center text-[9pt] font-semibold text-red-700">
               <p>El presente checklist documenta el estado observable sin intervención técnica interna. El cliente declara haber sido informado y acepta que componentes marcados como "No" o "S/C" pueden requerir diagnóstico adicional.</p>
           </div>
        </div>
        
        {/* Terms and Conditions */}
        <div className="mt-4 text-[7pt] leading-tight">
           <h3 className="font-bold text-center mb-2 text-xs">Términos y Condiciones del Servicio</h3>
           <ol className="list-decimal list-inside space-y-0.5 border border-gray-200 p-2 rounded">
                <li><strong>Diagnóstico y Presupuesto:</strong> {settings?.budgetVariationText}</li>
                <li><strong>Responsabilidad sobre Datos:</strong> {settings?.dataLossPolicyText}</li>
                <li><strong>Equipos sin Encender/Clave:</strong> {settings?.untestedDevicePolicyText}</li>
                <li><strong>Garantía:</strong> {settings?.warrantyConditions}</li>
                <li><strong>Anulación de Garantía:</strong> {settings?.warrantyVoidConditionsText}</li>
                <li><strong>Política de Abandono:</strong> {settings?.abandonmentPolicyText}</li>
           </ol>
        </div>

        {/* Signature Area */}
        <footer className="mt-6">
          <p className="text-center text-[9pt] font-bold mb-6">Declaro conformidad con el estado inicial del equipo y acepto los términos y condiciones del servicio.</p>
          <div className="flex justify-around items-end gap-12">
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Firma del Cliente</div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Aclaración y DNI</div>
            </div>
          </div>
          <div className="text-center text-[8pt] mt-4 text-gray-500">
             <p>{settings?.companyName} | CUIT: {settings?.companyCuit || "N/A"} | {settings?.companyAddress}</p>
          </div>
        </footer>
      </section>

      {/* SECTION 2: PICKUP RECEIPT */}
      <div className="page-break"></div>
      <section className="section-container">
        {/* Header */}
         <header className="flex justify-between items-start pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
            {settings?.companyLogoUrl && (
              <Image
                src={settings.companyLogoUrl}
                alt={`${settings.companyName || ''} Logo`}
                width={120}
                height={40}
                className="object-contain"
                data-ai-hint="company logo"
              />
            )}
            <div>
              <h1 className="font-bold text-lg">{settings?.companyName || "Nombre de la Tienda"}</h1>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-xl">Comprobante de Retiro</h2>
            <p className="font-mono text-base">N° Orden: {order.orderNumber}</p>
             {qrUrl && <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}`} alt="QR Code" width={80} height={80} className="ml-auto mt-2" data-ai-hint="qr code"/>}
          </div>
        </header>

        {/* Content */}
        <div className="my-6">
            <p className="mb-2"><strong>Cliente:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
            <p className="mb-2"><strong>Dispositivo:</strong> {order.deviceBrand} {order.deviceModel} (IMEI/Serial: {order.deviceIMEI})</p>
            <p className="mb-4"><strong>Fecha de Retiro:</strong> ______ / ______ / ________</p>
            
            <div className="p-4 border border-gray-300 rounded bg-gray-50 text-justify">
                <p className="font-semibold">
                    Declaro que retiro el equipo en las condiciones detalladas, y que fui informado del tipo de reparación, garantía y observaciones. Acepto las condiciones del servicio.
                </p>
                <p className="mt-2">
                    {settings?.pickupConditions}
                </p>
            </div>
        </div>
        
         {/* Unlock Pattern Section */}
        <div className="mt-4 p-2 bg-gray-100 rounded text-center">
            <h4 className="font-bold mb-2">Clave / Patrón de Desbloqueo informado por el Cliente</h4>
            <div className="flex justify-center items-center gap-4">
                <Image
                    src="https://static.vecteezy.com/system/resources/previews/005/148/464/non_2x/lock-screen-pattern-icon-in-flat-style-vector.jpg"
                    alt="Patrón de desbloqueo"
                    width={80}
                    height={80}
                    className="object-contain"
                    data-ai-hint="unlock pattern"
                />
                <div className="border-b-2 border-dotted border-gray-400 w-48 h-1 self-end mb-4"></div>
            </div>
        </div>

        {/* Signature Area */}
        <footer className="mt-16">
           <div className="flex justify-around items-end gap-12">
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Firma del Cliente</div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Aclaración y DNI</div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Firma del Técnico que Entrega</div>
            </div>
          </div>
           <div className="text-center text-[8pt] mt-4 text-gray-500">
             <p>Gracias por confiar en {settings?.companyName || "nosotros"}.</p>
          </div>
        </footer>
      </section>
    </div>
  );
}
