// src/app/(app)/schedule/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // for click and selectable
import esLocale from '@fullcalendar/core/locales/es';

import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getOrders } from '@/lib/actions/order.actions';
import type { Order, OrderStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Helper function to assign colors based on order status
const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'Recibido':
    case 'Presupuestado':
      return 'hsl(var(--primary) / 0.7)'; // Primary color with some transparency
    case 'En Diagnóstico':
    case 'En Reparación':
      return 'hsl(var(--accent))'; // Accent color (orange)
    case 'Listo para Entrega':
      return '#22c55e'; // A specific green (green-500)
    case 'En Espera de Repuestos':
    case 'Presupuesto Rechazado':
      return 'hsl(var(--destructive))'; // Destructive color
    case 'Entregado':
      return 'hsl(var(--muted-foreground) / 0.7)'; // Muted foreground
    default:
      return 'hsl(var(--muted))'; // Muted
  }
};

export default function SchedulePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndSetEvents = async () => {
      try {
        const orders = await getOrders();
        const calendarEvents = orders.map((order: Order) => ({
          title: `${order.orderNumber}: ${order.deviceBrand} ${order.deviceModel}`,
          date: order.entryDate as string,
          allDay: true,
          extendedProps: {
            orderId: order.id,
            status: order.status,
            client: `${order.clientName} ${order.clientLastName}`,
          },
          backgroundColor: getStatusColor(order.status),
          borderColor: getStatusColor(order.status),
        }));
        setEvents(calendarEvents);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar las órdenes para el calendario.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetEvents();
  }, [toast]);

  const handleEventClick = (clickInfo: any) => {
    const orderId = clickInfo.event.extendedProps.orderId;
    if (orderId) {
      router.push(`/orders/${orderId}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario de Órdenes"
        description="Visualice las órdenes de servicio por fecha de ingreso."
      />
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <LoadingSpinner size={48} />
              <p className="ml-4">Cargando calendario...</p>
            </div>
          ) : (
            <div className="calendar-container">
              <style jsx global>{`
                .fc-event {
                  cursor: pointer;
                  padding: 4px 6px;
                  border-radius: 4px;
                }
                .fc-event-main {
                  font-size: 0.8rem;
                  color: #fff;
                  font-weight: 500;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .fc .fc-toolbar-title {
                  font-size: 1.5em;
                  font-weight: 700;
                  color: hsl(var(--primary));
                }
                .fc .fc-button {
                  background-color: hsl(var(--primary)) !important;
                  border-color: hsl(var(--primary)) !important;
                  color: hsl(var(--primary-foreground)) !important;
                  box-shadow: none !important;
                  outline: none !important;
                  transition: background-color 0.2s;
                }
                 .fc .fc-button:hover {
                    background-color: hsl(var(--primary) / 0.9) !important;
                 }
                .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active {
                  background-color: hsl(var(--primary) / 0.8) !important;
                  border-color: hsl(var(--primary) / 0.8) !important;
                }
                .fc .fc-daygrid-day.fc-day-today {
                   background-color: hsl(var(--primary) / 0.05);
                }
              `}</style>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={events}
                eventClick={handleEventClick}
                locale={esLocale}
                height="auto"
                editable={false}
                droppable={false}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
