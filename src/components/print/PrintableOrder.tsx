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

  const checklistGroups = CHECKLIST_ITEMS.reduce((acc, item) => {
    const value = order.checklist?.[item.id as keyof Checklist];
    if (value) {
        (acc[item.group] = acc[item.group] || []).push({ ...item, value });
    }
    return acc;
  }, {} as Record<string, (typeof CHECKLIST_ITEMS[0] & { value: any })[]>);

  const getChecklistValueDisplay = (value: 'si' | 'no' | 'sc' | string | undefined) => {
    if (value === 'si') return "✅ Sí";
    if (value === 'no') return "❌ No";
    if (value === 'sc') return "🟡 No comprobado";
    if (value) return value;
    return 'N/A';
  }

  return (
    <div className="font-sans text-xs text-black bg-white p-6">
      {/* SECTION 1: LEGAL CHECK-IN DOCUMENT */}
      <section className="section-container">
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b border-gray-400">
          <div className="flex items-center gap-4">
            {settings?.companyLogoUrl && (
              <Image
                src={settings.companyLogoUrl}
                alt={`${settings.companyName || ''} Logo`}
                width={100}
                height={35}
                className="object-contain"
                data-ai-hint="company logo"
              />
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
        
        {/* Client and Device Details */}
        <div className="grid grid-cols-2 gap-4 my-3">
          <div className="border border-gray-200 p-2 rounded-md">
            <h3 className="font-bold border-b border-gray-200 pb-1 mb-1 text-center">Datos del Cliente</h3>
            <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
            <p><strong>DNI:</strong> {order.clientId || 'N/A'}</p> 
            <p><strong>Teléfono:</strong> {order.clientPhone || 'N/A'}</p>
            <p><strong>Email:</strong> {order.clientName ? 'Obtenido de ficha' : 'N/A'}</p>
          </div>
          <div className="border border-gray-200 p-2 rounded-md">
            <h3 className="font-bold border-b border-gray-200 pb-1 mb-1 text-center">Datos del Dispositivo</h3>
            <p><strong>Marca/Modelo:</strong> {order.deviceBrand} {order.deviceModel}</p>
            <p><strong>IMEI/Serial:</strong> {order.deviceIMEI}</p>
            <p><strong>Accesorios Entregados:</strong> {order.accessories || "Ninguno"}</p>
          </div>
        </div>
        
        {/* Unlock Authorization Block */}
         <div className="border border-gray-200 p-2 rounded-md mb-3">
            <h3 className="font-bold text-center">Autorización de Acceso al Sistema del Equipo</h3>
            {!order.unlockPatternProvided ? (
                 <div className="my-1 p-2 border border-dashed border-red-600 bg-red-50 text-red-900 text-center font-semibold text-[9pt]">
                    <p>El cliente NO autoriza el acceso total al sistema del equipo (no proporciona patrón, PIN o clave).</p>
                    <p className="font-bold">Las funciones internas no podrán ser testeadas y figurarán como "NO COMPROBADAS". La empresa NO se hace responsable por fallas posteriores en dichos periféricos.</p>
                </div>
            ) : (
                <div className="my-1 p-2 border border-dashed border-green-600 bg-green-50 text-green-900 text-center font-semibold text-[9pt]">
                    <p>El cliente SÍ autoriza el acceso total al sistema para su completa evaluación.</p>
                </div>
            )}
        </div>

        {/* Technical Checklist */}
        <div className="border border-gray-200 p-2 rounded-md mb-3">
           <h3 className="font-bold border-b border-gray-200 pb-1 mb-1 text-center">Checklist Técnico Preliminar</h3>
            <p className="text-[7pt] text-center italic mb-2">
                "Sí": Funciona correctamente. "No": Presenta falla o daño. "No comprobado": No pudo ser evaluado por falta de energía o desbloqueo.
            </p>
            <div className="space-y-2">
            {Object.entries(checklistGroups).map(([groupName, items]) => (
                <div key={groupName}>
                    <p className="font-semibold text-[8pt] underline">{groupName}:</p>
                    <div className="grid grid-cols-2 gap-x-4">
                        {items.map(item => (
                            <div key={item.id} className="border-b border-dotted flex justify-between text-[8pt]">
                                <span>{item.label}:</span>
                                <span className="font-bold">{getChecklistValueDisplay(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            </div>
            <div className="mt-2">
                <p className="font-semibold text-[8pt] underline">Observaciones (Daños y Fallas Reportadas):</p>
                <p className="text-[8pt]">{order.declaredFault || "Sin fallas reportadas por el cliente."}</p>
                <p className="text-[8pt]">Daños visibles: {order.damageRisk || "Sin daños visibles reportados."}</p>
            </div>
        </div>
        
        {/* Legal Conformity Clause */}
        <div className="mt-3 text-[7pt] leading-tight">
           <h3 className="font-bold text-center mb-1 text-[9pt]">Cláusula de Conformidad</h3>
           <ol className="list-decimal list-inside space-y-0.5 border border-gray-300 p-2 rounded-md bg-gray-50">
                <li>El cliente declara que los datos y estados ingresados en este documento son fieles al estado del equipo al momento de su entrega.</li>
                <li>Acepta que la revisión aquí detallada es externa, preliminar y sin apertura del equipo.</li>
                <li>Comprende y acepta que si no autorizó el desbloqueo del equipo, existen componentes no evaluados y la empresa no se responsabiliza por el funcionamiento de los mismos.</li>
                <li>La responsabilidad del servicio técnico queda limitada exclusivamente al componente a reemplazar o al servicio a prestar según el diagnóstico final.</li>
                <li>La empresa no se responsabiliza por fallos o vicios ocultos que no pudieron ser diagnosticados en esta etapa preliminar.</li>
                <li>El cliente acepta las condiciones generales del servicio, disponibles en el local y/o en formato digital, que regulan la garantía, plazos y políticas de abandono.</li>
                <li>En caso de no aceptar el presupuesto final, podrá retirar el equipo sin costo de revisión.</li>
           </ol>
        </div>

        {/* Signature Area */}
        <footer className="mt-4 pt-4 border-t border-dashed border-gray-400">
          <p className="text-center text-[9pt] font-bold mb-6">Declaro mi conformidad con el estado inicial de mi equipo y acepto las cláusulas detalladas.</p>
          <div className="flex justify-around items-end gap-12">
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
      </section>
    </div>
  );
}
