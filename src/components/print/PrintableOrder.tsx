// src/components/print/PrintableOrder.tsx
"use client";

import type { Order } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";

interface PrintableOrderProps {
  order: Order;
}

export function PrintableOrder({ order }: PrintableOrderProps) {
  const settings = order.storeSettingsSnapshot;
  const qrUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/orders/${order.id}` 
    : '';

  const totalCost = (order.costLabor || 0) + (order.costSparePart || 0);

  const checklistItems = [
    { label: "Marcas/golpes", value: order.checklist?.golpe },
    { label: "Cristal astillado/roto", value: order.checklist?.cristal },
    { label: "Marco roto/dañado", value: order.checklist?.marco },
    { label: "Tapa trasera", value: order.checklist?.tapa },
    { label: "Enciende", value: order.checklist?.enciende },
    { label: "Táctil", value: order.checklist?.tactil },
    { label: "Imagen", value: order.checklist?.imagen },
    { label: "Botones", value: order.checklist?.botones },
    { label: "Cámara Trasera", value: order.checklist?.cam_trasera },
    { label: "Cámara Delantera", value: order.checklist?.cam_delantera },
    { label: "Pin de Carga", value: order.checklist?.pin_carga },
    { label: "Wi-Fi / BT", value: order.checklist?.wifi_bluetooth },
    { label: "Señal", value: order.checklist?.senal },
    { label: "Humedad", value: order.checklist?.humedad },
  ].filter(item => item.value); // Only show items that have a value

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
           <h3 className="font-bold border-b border-gray-200 pb-1 mb-2">Falla Reportada y Estado Físico</h3>
           <p><strong>Falla Reportada:</strong> {order.declaredFault || "No especificada"}</p>
           <p><strong>Observaciones de Ingreso:</strong> {order.damageRisk || "Sin daños visibles reportados."}</p>
           <div className="mt-2">
             <h4 className="font-semibold">Checklist de Ingreso:</h4>
             <ul className="list-disc list-inside columns-2">
                {checklistItems.map(item => (
                    <li key={item.label}>
                       {item.label}: <span className="font-semibold uppercase">{item.value}</span>
                    </li>
                ))}
             </ul>
           </div>
        </div>
        
        {/* Terms and Conditions */}
        <div className="mt-4 text-[9pt] leading-snug">
           <h3 className="font-bold text-center mb-2">Términos y Condiciones del Servicio de Reparación</h3>
           <div className="p-2 border border-gray-300 bg-gray-50 rounded">
             <p className="font-bold mb-2 text-center">IMPORTANTE: Este documento no implica presupuesto aprobado. El costo final será notificado para su aprobación.</p>
             <ol className="list-decimal list-inside space-y-1">
                <li><strong>Diagnóstico y Presupuesto:</strong> {settings?.budgetVariationText}</li>
                <li><strong>Responsabilidad sobre Datos:</strong> {settings?.dataLossPolicyText}</li>
                <li><strong>Equipos sin Encender/Clave:</strong> {settings?.untestedDevicePolicyText}</li>
                <li><strong>Riesgos Especiales:</strong> {settings?.highRiskDeviceText}</li>
                <li><strong>Garantía:</strong> {settings?.warrantyConditions}</li>
                <li><strong>Anulación de Garantía:</strong> {settings?.warrantyVoidConditionsText}</li>
                <li><strong>Política de Abandono:</strong> {settings?.abandonmentPolicyText}</li>
             </ol>
           </div>
        </div>

        {/* Signature Area */}
        <footer className="mt-12">
          <div className="flex justify-around items-end gap-12">
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Firma del Cliente</div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Aclaración</div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Firma del Técnico Responsable</div>
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
        <div className="my-8">
            <p className="mb-4"><strong>Cliente:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
            <p className="mb-4"><strong>Dispositivo:</strong> {order.deviceBrand} {order.deviceModel} (IMEI/Serial: {order.deviceIMEI})</p>
            <p className="mb-4"><strong>Fecha de Retiro:</strong> ______ / ______ / ________</p>
            
            <div className="p-4 border border-gray-300 rounded bg-gray-50 text-justify">
                <p>
                    Declaro haber recibido el dispositivo arriba mencionado en conformidad. He verificado el funcionamiento del mismo y estoy de acuerdo con la reparación efectuada.
                </p>
                <p className="mt-2">
                    Entiendo que la garantía de la reparación es de <strong>{settings?.warrantyConditions?.match(/\d+/)?.[0] || '90'} días</strong>, cubriendo exclusivamente la falla reparada y las piezas reemplazadas, según los términos y condiciones firmados en el comprobante de ingreso. La garantía no cubre daños por mal uso, golpes, humedad o intervención de terceros.
                </p>
            </div>
        </div>

        {/* Signature Area */}
        <footer className="mt-24">
           <div className="flex justify-around items-end gap-12">
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Firma del Cliente</div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-1">Aclaración</div>
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
