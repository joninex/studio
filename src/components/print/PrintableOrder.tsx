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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {settings?.companyLogoUrl ? (
            <Image
              src={settings.companyLogoUrl}
              alt={`${settings.companyName || ''} Logo`}
              width={120}
              height={40}
              style={{ objectFit: 'contain' }}
              data-ai-hint="company logo"
            />
          ) : (
            <div style={{ width: '120px', height: '40px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>{settings.companyName}</h1>
            </div>
          )}
          <div>
            <p style={{ fontSize: '10px' }}>{settings.companyAddress}</p>
            <p style={{ fontSize: '10px' }}>{settings.companyContactDetails}</p>
            <p style={{ fontSize: '10px' }}>CUIT: {settings.companyCuit || "N/A"}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Orden de Recepción Técnica</h2>
          <p style={{ fontFamily: 'monospace', fontSize: '16px', marginTop: '8px' }}>N° Orden: {order.orderNumber}</p>
          <p style={{ fontSize: '10px' }}>Fecha: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm", { locale: es })}</p>
        </div>
      </header>

      <main className="print-main">
        <section className="print-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

        <section className="print-section">
          <h3 className="section-title">Falla Declarada por el Cliente</h3>
          <p style={{ border: '1px solid #eee', padding: '8px', minHeight: '40px', borderRadius: '4px' }}>{order.declaredFault || "N/A"}</p>
        </section>
        
        {!order.unlockPatternProvided && (
            <section className="print-section" style={{ border: '1px solid #f00', padding: '8px', borderRadius: '4px', background: '#fff0f0' }}>
                <h3 className="section-title" style={{ color: '#d00' }}>¡ATENCIÓN! Equipo Sin Código de Desbloqueo</h3>
                <p style={{ fontSize: '10px', color: '#d00' }}>{DEFAULT_STORE_SETTINGS.noUnlockCodeDisclaimer}</p>
            </section>
        )}

        <section className="print-section break-inside-avoid">
          <h3 className="section-title">Checklist Técnico de Ingreso</h3>
           <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
            <strong>Significado:</strong> ✅ Sí (Funciona) | ❌ No (Falla) | 🟡 S/C (Sin Comprobar por falta de acceso/energía)
          </div>
          {Object.entries(checklistGroups).map(([groupName, items]) => (
            <div key={groupName} style={{ marginBottom: '8px' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '12px', color: '#333' }}>{groupName}</h4>
              <div style={{ columns: 2, gap: '24px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0', borderBottom: '1px dotted #ccc' }}>
                    <span>{item.label}:</span>
                    <span style={{ fontWeight: 'bold' }}>{getChecklistValueDisplay(order.checklist[item.id as keyof Checklist])}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="print-section">
            <h3 className="section-title">Daños y Observaciones Adicionales</h3>
            <p style={{ border: '1px solid #eee', padding: '8px', minHeight: '40px', borderRadius: '4px' }}>{order.damageRisk || "Sin daños pre-existentes reportados."}</p>
        </section>
      </main>

      <footer className="print-footer">
        <div style={{ fontSize: '10px', textAlign: 'justify', border: '1px solid #ccc', padding: '8px', borderRadius: '4px', background: '#f9f9f9' }}>
          <h3 style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>Cláusula de Conformidad de Ingreso</h3>
          <p>{settings.intakeConformityText}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', gap: '48px', paddingTop: '64px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid black', paddingTop: '4px' }}>Firma del Cliente</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid black', paddingTop: '4px' }}>Aclaración</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid black', paddingTop: '4px' }}>DNI</div>
          </div>
        </div>
      </footer>
    </div>
  );

  const PageTwo = () => (
     <div className="print-page">
        <header className="print-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {settings?.companyLogoUrl ? (
              <Image src={settings.companyLogoUrl} alt={`${settings.companyName || ''} Logo`} width={120} height={40} style={{ objectFit: 'contain' }} data-ai-hint="company logo" />
            ) : (
             <div style={{ width: '120px', height: '40px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>{settings.companyName}</h1>
            </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Comprobante para Cliente</h2>
            <p style={{ fontFamily: 'monospace', fontSize: '16px', marginTop: '8px' }}>N° Orden: {order.orderNumber}</p>
            <p style={{ fontSize: '10px' }}>Fecha Ingreso: {format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm", { locale: es })}</p>
          </div>
        </header>

        <main className="print-main">
            <section className="print-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <h3 className="section-title">Falla Declarada por el Cliente</h3>
                <p style={{ border: '1px solid #eee', padding: '8px', minHeight: '40px', borderRadius: '4px' }}>{order.declaredFault || "N/A"}</p>
            </section>

             <section className="print-section">
                <h3 className="section-title">Estado Actual de la Orden</h3>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>{order.status}</p>
            </section>
        </main>
        
        <footer className="print-footer">
            <div style={{ textAlign: 'center', border: '2px solid black', padding: '8px', borderRadius: '4px', marginBottom: '16px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '12px' }}>IMPORTANTE: CONSERVE ESTE COMPROBANTE PARA RETIRAR SU EQUIPO</p>
            </div>
            <div style={{ fontSize: '10px', textAlign: 'justify', border: '1px solid #ccc', padding: '8px', borderRadius: '4px', background: '#f9f9f9' }}>
                <h3 style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>Términos y Condiciones del Servicio</h3>
                <p>{settings.clientVoucherLegalReminder}</p>
            </div>
             <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', gap: '48px', paddingTop: '64px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid black', paddingTop: '4px' }}>Firma al Retirar</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid black', paddingTop: '4px' }}>Aclaración</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid black', paddingTop: '4px' }}>DNI</div>
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
