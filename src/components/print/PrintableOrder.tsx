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
  };
  
  const checklistGroups = CHECKLIST_ITEMS.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {} as Record<string, typeof CHECKLIST_ITEMS>);

  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  const PageOne = () => (
    <div className="print-page">
      <header className="print-header">
        <div className="company-details">
          {settings?.companyLogoUrl ? (
            <Image
              src={settings.companyLogoUrl}
              alt={`${settings.companyName || ''} Logo`}
              width={120}
              height={40}
              className="logo"
              data-ai-hint="company logo"
            />
          ) : (
            <div className="logo-placeholder">
              <span className="font-bold text-lg">{settings.companyName}</span>
            </div>
          )}
          <div className="contact-info">
            <p>{settings.companyAddress}</p>
            <p>{settings.companyContactDetails}</p>
            <p>CUIT: {settings.companyCuit || "N/A"}</p>
          </div>
        </div>
        <div className="order-details">
          <h2>Orden de Recepción Técnica</h2>
          <p className="order-number">N° Orden: {order.orderNumber}</p>
          <p>Fecha: {order.entryDate ? format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A'}</p>
        </div>
      </header>

      <main className="print-main">
        <section className="print-section grid-2-col">
          <div>
            <h3 className="section-title">1. Datos del Cliente</h3>
            <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
            <p><strong>DNI:</strong> {order.clientId || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {order.clientPhone || 'N/A'}</p>
          </div>
          <div>
            <h3 className="section-title">2. Datos del Equipo</h3>
            <p><strong>Marca/Modelo:</strong> {order.deviceBrand} {order.deviceModel}</p>
            <p><strong>IMEI/Serial:</strong> {order.imeiNotVisible ? "No visible al ingreso" : order.deviceIMEI}</p>
            <p><strong>Accesorios:</strong> {order.observations || "Ninguno"}</p>
          </div>
        </section>

        <section className="print-section">
          <h3 className="section-title">3. Falla Declarada por el Cliente</h3>
          <p className="bordered-box">{order.declaredFault || "N/A"}</p>
        </section>
        
        {!order.unlockPatternProvided && (
            <div className="warning-box">
                <h3 className="section-title warning-title">¡ATENCIÓN! Equipo Sin Código de Desbloqueo</h3>
                <p>{settings.noUnlockCodeDisclaimer}</p>
            </div>
        )}

        <section className="print-section break-inside-avoid">
          <h3 className="section-title">4. Checklist Técnico de Ingreso</h3>
           <p className="legend">
            <strong>Significado:</strong> ✅ Sí (Funciona) | ❌ No (Falla) | 🟡 S/C (Sin Comprobar)
          </p>
          {Object.entries(checklistGroups).map(([groupName, items]) => (
            <div key={groupName} className="checklist-group">
              <h4>{groupName}</h4>
              <table className="checklist-table">
                <tbody>
                  {chunkArray(items, 3).map((triple, index) => (
                    <tr key={index}>
                      <td>{triple[0].label}:</td>
                      <td><strong>{getChecklistValueDisplay(order.checklist[triple[0].id as keyof Checklist])}</strong></td>
                      
                      {triple[1] ? <>
                        <td>{triple[1].label}:</td>
                        <td><strong>{getChecklistValueDisplay(order.checklist[triple[1].id as keyof Checklist])}</strong></td>
                      </> : <><td></td><td></td></>}

                      {triple[2] ? <>
                        <td>{triple[2].label}:</td>
                        <td><strong>{getChecklistValueDisplay(order.checklist[triple[2].id as keyof Checklist])}</strong></td>
                      </> : <><td></td><td></td></>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
        
        <section className="print-section">
            <h3 className="section-title">5. Daños y Observaciones Adicionales</h3>
            <p className="bordered-box">{order.damageRisk || "Sin daños pre-existentes reportados."}</p>
        </section>
      </main>

      <footer className="print-footer">
        <div className="legal-text">
          <h3 className="section-title legal-title">Cláusula de Conformidad de Ingreso</h3>
          <p>{settings.intakeConformityText}</p>
        </div>
        <div className="signature-area">
          <div className="signature-box"><p>Firma del Cliente</p></div>
          <div className="signature-box"><p>Aclaración</p></div>
          <div className="signature-box"><p>DNI</p></div>
        </div>
      </footer>
    </div>
  );

  const PageTwo = () => (
     <div className="print-page customer-copy">
        <header className="print-header">
           <div className="company-details">
            {settings?.companyLogoUrl ? (
              <Image src={settings.companyLogoUrl} alt={`${settings.companyName || ''} Logo`} width={120} height={40} className="logo" data-ai-hint="company logo" />
            ) : (
             <div className="logo-placeholder">
              <h2 className="font-bold text-lg">{settings.companyName}</h2>
            </div>
            )}
          </div>
          <div className="order-details">
            <h2>Comprobante para Cliente</h2>
            <p className="order-number">N° Orden: {order.orderNumber}</p>
            <p>Fecha Ingreso: {order.entryDate ? format(parseISO(order.entryDate as string), "dd/MM/yyyy HH:mm", { locale: es }) : 'N/A'}</p>
          </div>
        </header>

        <main className="print-main">
            <section className="print-section grid-2-col">
                <div>
                    <h3 className="section-title">Cliente</h3>
                    <p><strong>Nombre:</strong> {order.clientName || 'N/A'} {order.clientLastName || ''}</p>
                    <p><strong>DNI:</strong> {order.clientId || 'N/A'}</p> 
                </div>
                <div>
                    <h3 className="section-title">Equipo</h3>
                    <p><strong>Dispositivo:</strong> {order.deviceBrand} {order.deviceModel}</p>
                    <p><strong>IMEI/Serial:</strong> {order.imeiNotVisible ? "Pendiente de registrar" : order.deviceIMEI}</p>
                </div>
            </section>
            
            <section className="print-section">
                <h3 className="section-title">Falla Declarada por el Cliente</h3>
                <p className="bordered-box">{order.declaredFault || "N/A"}</p>
            </section>
        </main>
        
        <footer className="print-footer">
            <div className="legal-text important-note">
                <p><strong>IMPORTANTE: CONSERVE ESTE COMPROBANTE PARA RETIRAR SU EQUIPO</strong></p>
                <p>{settings.clientVoucherLegalReminder}</p>
            </div>
             <div className="signature-area">
                <div className="signature-box"><p>Firma al Retirar</p></div>
                <div className="signature-box"><p>Aclaración</p></div>
                <div className="signature-box"><p>DNI</p></div>
            </div>
        </footer>
    </div>
  );

  return (
     <div className="talonario">
      <div className="copia-taller">
        <PageOne />
      </div>
      <div className="corte">
        <p>Recortar por la línea de puntos</p>
      </div>
       <div className="copia-cliente">
        <PageTwo />
      </div>
    </div>
  );
}
