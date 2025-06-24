// src/components/layout/NotificationBell.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { getNotificationsForUser, markAllAsRead } from "@/lib/actions/notification.actions";
import type { Notification } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      const fetchNotifications = async () => {
        const userNotifications = await getNotificationsForUser(user.uid);
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter(n => !n.read).length);
      };
      fetchNotifications();
      
      // Basic polling to simulate real-time updates
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllAsRead = async () => {
    if (!user?.uid || unreadCount === 0) return;
    
    // Optimistic UI update
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    await markAllAsRead(user.uid);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          Notificaciones
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-1 text-xs">
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {notifications.length > 0 ? (
            notifications.slice(0, 5).map(notif => {
              const Icon = notif.icon;
              return (
                <DropdownMenuItem key={notif.id} asChild>
                  <Link href={notif.link} className={cn("flex items-start gap-3 cursor-pointer", !notif.read && "bg-primary/5")}>
                    {Icon && <Icon className="h-4 w-4 mt-1 text-primary shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm leading-tight">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                     {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })
          ) : (
            <DropdownMenuItem disabled>
              <p className="text-sm text-muted-foreground text-center w-full py-4">No hay notificaciones</p>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
