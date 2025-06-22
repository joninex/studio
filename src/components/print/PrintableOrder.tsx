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

  const checklistGroups = CHECKLIST_ITEMS.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {} as Record<string, typeof CHECKLIST_ITEMS>);

  const getChecklistValueDisplay = (value: 'si' | 'no' | 'sc' | string | undefined) => {
    if (value === 'si') return "✅ Sí";
    if (value === 'no') return "❌ No";
    if (value === 'sc') return "🟡 No comprobado";
    if (value) return value;
    return 'N/A';
  }

  return (
    <div className="font-sans text-xs text-black bg-white p-6 printable-a4">
      {/* Header */}
      <header className="flex justify-between items-start pb-4 border-b border-gray-400">
        <div className="flex items-center gap-4">
          {settings?.companyLogoUrl ? (
            <Image
              src={settings.companyLogoUrl}
              alt={`${settings.companyName || ''} Logo`}
              width={100}
              height={35}
              className="object-contain"
              data-ai-hint="company logo"
            />
          ) : (
             <div className="w-[100px] h-[35px] bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xs">Logo</span>
             </div>
          )}
          <div>
            <h1 className="font-bold text-base">{settings?.companyName || "Nombre de la Tienda"}</h1>
            <p className="text-[9pt]">{settings?.companyAddress || "Dirección no especificada"}</p>
            <p className="text-[9pt]">{settings?.companyContactDetails || "Contacto no especificado"}</p>
            <p className="text-[9pt]">CUIT: {settings?.companyCuit || "N/A"}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-bold text-lg">Checklist Técnico de Ingreso</h2>
          <p className="text-[8pt] font-semibold">Adaptado al Marco Legal Argentino (Ley 24.240 / ENACOM)</p>
          <p className="font-mono text-base mt-2">N° Orden: {order.orderNumber}</p>
          <p>Fecha: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </header>
      
      {/* Customer & Device Details */}
       <div className="grid grid-cols-2 gap-4 my-3 text-[9pt]">
            <div className="border border-gray-300 p-2 rounded">
                <h3 className="font-bold border-b border-gray-200 pb-1 mb-1 text-center">Datos del Cliente</h3>
                <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
                <p><strong>DNI:</strong> {order.clientId || 'N/A'}</p> 
                <p><strong>Teléfono:</strong> {order.clientPhone || 'N/A'}</p>
            </div>
            <div className="border border-gray-300 p-2 rounded">
                <h3 className="font-bold border-b border-gray-200 pb-1 mb-1 text-center">Datos del Dispositivo</h3>
                <p><strong>Marca/Modelo:</strong> {order.deviceBrand} {order.deviceModel}</p>
                <p><strong>IMEI/Serial:</strong> {order.deviceIMEI}</p>
                <p><strong>Accesorios:</strong> {order.accessories || "Ninguno"}</p>
            </div>
      </div>

      {/* Legal Intro */}
      <div className="text-[8pt] italic text-center p-2 border border-gray-200 rounded bg-gray-50 mb-3">
          El presente checklist forma parte del diagnóstico inicial no invasivo del equipo al momento de su recepción. Tiene como finalidad documentar el estado físico y funcional observable sin intervención técnica interna. El cliente declara haber sido informado del estado aquí detallado y acepta que cualquier componente marcado como "NO" o "SIN COMPROBAR" podría requerir diagnóstico técnico adicional.
      </div>

      {/* Unlock Authorization Block */}
      <div className="border border-gray-300 p-2 rounded mb-3">
        <h3 className="font-bold text-center mb-1">Autorización de Acceso al Sistema del Equipo</h3>
        {!order.unlockPatternProvided ? (
            <div className="my-1 p-2 border border-dashed border-red-600 bg-red-50 text-red-900 text-center font-semibold text-[8pt]">
                <p className="font-bold text-base">ACCESO NO AUTORIZADO</p>
                <p>{settings.untestedDevicePolicyText}</p>
            </div>
        ) : (
            <div className="my-1 p-2 border border-dashed border-green-600 bg-green-50 text-green-900 text-center font-semibold text-[8pt]">
                <p className="font-bold text-base">ACCESO AUTORIZADO</p>
                <p>El cliente autoriza el acceso total al sistema para su completa evaluación.</p>
            </div>
        )}
      </div>

      {/* Technical Checklist */}
      <div className="border border-gray-300 p-2 rounded mb-3">
         <h3 className="font-bold border-b border-gray-200 pb-1 mb-2 text-center">Checklist Técnico Preliminar</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[8pt]">
          {Object.entries(checklistGroups).map(([groupName, items]) => (
              <div key={groupName} className="break-inside-avoid">
                  <p className="font-bold text-[9pt] underline mb-1">{groupName}:</p>
                  {items.map(item => (
                      <div key={item.id} className="border-b border-dotted flex justify-between">
                          <span>{item.label}:</span>
                          <span className="font-bold">{getChecklistValueDisplay(order.checklist[item.id as keyof Checklist])}</span>
                      </div>
                  ))}
              </div>
          ))}
          </div>
          <div className="mt-2 text-[8pt]">
              <p className="font-bold text-[9pt] underline">Observaciones y Daños Reportados:</p>
              <p><strong>Falla declarada:</strong> {order.declaredFault || "Sin fallas reportadas por el cliente."}</p>
              <p><strong>Daños físicos visibles:</strong> {order.damageRisk || "Sin daños visibles reportados."}</p>
          </div>
      </div>
      
      {/* Legal Conformity Clause */}
      <div className="mt-4 text-[7pt] leading-tight">
         <h3 className="font-bold text-center mb-1 text-[9pt]">Cláusula de Conformidad</h3>
         <ol className="list-decimal list-inside space-y-0.5 border border-gray-400 p-2 rounded bg-gray-50">
              <li>El cliente declara que los datos y estados ingresados en este documento son fieles al estado del equipo al momento de su entrega.</li>
              <li>Acepta que la revisión aquí detallada es externa y sin apertura del equipo.</li>
              <li>Comprende y acepta que si no autorizó el desbloqueo del equipo, existen componentes no evaluados y la empresa no se responsabiliza por el funcionamiento de los mismos.</li>
              <li>La responsabilidad del servicio técnico queda limitada exclusivamente al componente a reemplazar o al servicio a prestar según el diagnóstico final.</li>
              <li>La empresa no se responsabiliza por fallos o vicios ocultos que no pudieron ser diagnosticados en esta etapa preliminar.</li>
              <li>El cliente acepta las condiciones generales del servicio, disponibles en el local y/o en formato digital, que regulan la garantía, plazos y políticas de abandono.</li>
              <li>En caso de no aceptar el presupuesto final, podrá retirar el equipo sin costo de revisión.</li>
         </ol>
      </div>

      {/* Signature Area */}
      <footer className="mt-6 pt-4 border-t-2 border-dashed border-gray-500">
        <p className="text-center text-[8pt] font-bold mb-8">Declaro mi conformidad con el estado inicial de mi equipo y acepto las cláusulas detalladas.</p>
        <div className="flex justify-around items-end gap-12">
          <div className="flex-1 text-center">
            <div className="border-t-2 border-black pt-1 text-xs">Firma del Cliente</div>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t-2 border-black pt-1 text-xs">Aclaración</div>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t-2 border-black pt-1 text-xs">DNI</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
