// src/components/layout/AppShell.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Warehouse,
  BarChart,
  Contact,
  Smartphone,
  Lightbulb,
  Truck,
  Package,
  TrendingUp,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Órdenes", icon: FileText },
  { href: "/clients", label: "Clientes", icon: Contact },
  { href: "/inventory/parts", label: "Repuestos", icon: Package },
  { href: "/inventory/suppliers", label: "Proveedores", icon: Truck },
  { href: "/ai-guides", label: "Guías IA", icon: Lightbulb },
  { href: "/reports", label: "Reportes", icon: BarChart },
  { href: "/finance/income-report", label: "Reporte Ingresos", icon: TrendingUp },
  { href: "/finance/cashflow", label: "Flujo de Caja", icon: ArrowRightLeft },
  { href: "/users", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader>
           <Link href="/dashboard" className="flex items-center gap-2 p-2 hover:no-underline">
            <Smartphone className="h-8 w-8 text-primary transition-all duration-300 group-hover:animate-pulse" />
            <h1 className="font-headline text-xl font-bold text-primary group-data-[collapsible=icon]:hidden">
              NexusServ 360
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems
              .filter(item => !item.adminOnly || (user?.role === 'admin'))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        asChild={false}
                        isActive={pathname.startsWith(item.href)}
                      >
                         <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/80 px-4 shadow-sm backdrop-blur-sm sm:px-6">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden" />
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-primary">
                     <AvatarImage 
                      src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.uid}`} 
                      alt={user?.name || "Avatar de usuario"} 
                      data-ai-hint="user avatar"
                     />
                    <AvatarFallback>{user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
