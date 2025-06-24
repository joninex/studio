// src/lib/actions/notification.actions.ts
"use server";

import type { Notification } from "@/types";

let mockNotifications: Notification[] = [];
let notificationCounter = 0;

// --- Funciones para Backup y Restauración ---
export async function getRawNotificationData() {
  return {
    notifications: mockNotifications,
    counter: notificationCounter,
  };
}

export async function restoreNotificationData(data: { notifications: Notification[]; counter: number }) {
  mockNotifications = data.notifications || [];
  notificationCounter = data.counter || (data.notifications?.length ?? 0);
}
// --- Fin Funciones para Backup y Restauración ---


export async function createNotification(
  data: Omit<Notification, "id" | "createdAt" | "read">
): Promise<Notification> {
  await new Promise(resolve => setTimeout(resolve, 10)); // Simulate a quick db write
  
  notificationCounter++;
  const newNotification: Notification = {
    id: `notif-${Date.now()}-${notificationCounter}`,
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  };

  mockNotifications.unshift(newNotification); // Add to the top of the list
  // In a real app, you'd save this to Firestore
  return JSON.parse(JSON.stringify(newNotification));
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate db read
  const userNotifications = mockNotifications.filter(n => n.userId === userId);
  return JSON.parse(JSON.stringify(userNotifications));
}

export async function markAllAsRead(userId: string): Promise<{ success: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate db write
  mockNotifications.forEach(n => {
    if (n.userId === userId && !n.read) {
      n.read = true;
    }
  });
  return { success: true };
}
