// src/lib/actions/communication.actions.ts
"use server";

import type { Branch, MessageTemplateKey, Order, User } from "@/types";
import { getBranchById } from "./branch.actions";

/**
 * Generates a formatted WhatsApp message based on a template key.
 * This is the central place to define and manage the voice and tone of customer communications.
 *
 * @param templateKey The key for the message template to use.
 * @param order The order object containing relevant data.
 * @param branch The branch object for store-specific details.
 * @param user The user initiating the communication.
 * @returns A formatted message string.
 */
export async function getWhatsAppMessage(
  templateKey: MessageTemplateKey,
  order: Order,
  branch: Branch | null,
  user: User,
): Promise<string> {
  const storeName = branch?.settings?.companyName || "el taller";
  const userName = user?.name || "un representante";

  switch (templateKey) {
    case 'INITIAL_CONTACT':
      const estimatedTime = order.estimatedCompletionTime || 'el final del día';
      return (
        `Estimado/a ${order.clientName},\n\n` +
        `Le contactamos desde ${storeName} en relación a su orden de servicio N° ${order.orderNumber} ` +
        `para el equipo ${order.deviceBrand} ${order.deviceModel}.\n\n` +
        `Hemos registrado su ingreso y la hora de finalización estimada es a las ${estimatedTime}. ` +
        `Le notificaremos en cuanto el diagnóstico o la reparación esté completa.\n\n` +
        `Saludos cordiales,\n` +
        `${userName} de ${storeName}`
      );

    case 'DIAGNOSIS_READY':
        // Future implementation
        return `Estimado/a ${order.clientName}, el diagnóstico de su equipo ${order.deviceBrand} ${order.deviceModel} (Orden N° ${order.orderNumber}) está listo. Por favor, contáctenos para discutir el presupuesto. Saludos, ${storeName}.`;

    case 'READY_FOR_PICKUP':
        // Future implementation
        const totalCost = (order.costLabor || 0) + (order.costSparePart || 0);
        return `Estimado/a ${order.clientName}, le informamos que su equipo ${order.deviceBrand} ${order.deviceModel} (Orden N° ${order.orderNumber}) ya se encuentra reparado y listo para ser retirado. El monto a abonar es de $${totalCost.toFixed(2)}. Saludos, ${storeName}.`;

    default:
      return `Mensaje sobre la orden N° ${order.orderNumber}.`;
  }
}
