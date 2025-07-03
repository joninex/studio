// src/lib/actions/notification.actions.ts
"use server";

import type { Notification } from "@/types";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from 'firebase-admin/firestore';

// Mocks y funciones de backup/restore eliminados

function mapFirestoreDocToNotification(doc: FirebaseFirestore.DocumentSnapshot): Notification | null {
    if (!doc.exists) return null;
    const data = doc.data() as any;
    return {
        id: doc.id,
        userId: data.userId,
        message: data.message,
        link: data.link,
        read: data.read,
        icon: data.icon,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        // updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt, // Si se añade
    };
}

export async function createNotification(
  data: Omit<Notification, "id" | "createdAt" | "read" | "updatedAt">
): Promise<Notification> {
  const now = Timestamp.now();
  const newNotificationData = {
    ...data,
    read: false,
    createdAt: now,
    // updatedAt: now, // Si se añade
  };

  try {
    const docRef = await adminDb.collection('notifications').add(newNotificationData);

    const createdNotification: Notification = {
      id: docRef.id,
      userId: newNotificationData.userId,
      message: newNotificationData.message,
      link: newNotificationData.link,
      icon: newNotificationData.icon,
      read: newNotificationData.read,
      createdAt: now.toDate().toISOString(),
      // updatedAt: now.toDate().toISOString(), // Si se añade
    };
    return createdNotification;
  } catch (error) {
    console.error("Error al crear notificación:", error);
    throw error;
  }
}

export async function getNotificationsForUser(userId: string, limitCount: number = 20): Promise<Notification[]> {
  if (!userId) {
    console.warn("getNotificationsForUser: userId no proporcionado.");
    return [];
  }
  try {
    const snapshot = await adminDb.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => mapFirestoreDocToNotification(doc)).filter(Boolean) as Notification[];
  } catch (error) {
    console.error(`Error al obtener notificaciones para usuario ${userId}:`, error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<{ success: boolean }> {
  if (!notificationId || !userId) {
    console.warn("markNotificationAsRead: notificationId o userId no proporcionado.");
    return { success: false };
  }
  try {
    const notificationRef = adminDb.collection('notifications').doc(notificationId);
    const doc = await notificationRef.get();

    // Verificar que la notificación exista y pertenezca al usuario correcto antes de marcarla.
    if (doc.exists && doc.data()?.userId === userId) {
      await notificationRef.update({
        read: true,
        // updatedAt: Timestamp.now() // Si se añade campo updatedAt
      });
      return { success: true };
    }
    console.warn(`Notificación ${notificationId} no encontrada o no pertenece al usuario ${userId}.`);
    return { success: false };
  } catch (error) {
    console.error(`Error al marcar notificación ${notificationId} como leída:`, error);
    return { success: false };
  }
}


export async function markAllAsRead(userId: string): Promise<{ success: boolean }> {
  if (!userId) {
    console.warn("markAllAsRead: userId no proporcionado.");
    return { success: false };
  }
  try {
    const notificationsToUpdateQuery = adminDb.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false);

    const snapshot = await notificationsToUpdateQuery.get();

    if (snapshot.empty) {
      return { success: true };
    }

    const batch = adminDb.batch();
    // const now = Timestamp.now(); // Si se añade campo updatedAt

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        // updatedAt: now // Si se añade campo updatedAt
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(`Error al marcar todas las notificaciones como leídas para usuario ${userId}:`, error);
    return { success: false };
  }
}

// Funciones de backup/restore eliminadas explícitamente si estaban aquí.
// export async function getRawNotificationData() { ... }
// export async function restoreNotificationData(data) { ... }
