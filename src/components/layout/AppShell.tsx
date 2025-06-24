// src/components/layout/AppShell.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  BarChart,
  Contact,
  Smartphone,
  Truck,
  Package,
  TrendingUp,
  ArrowRightLeft,
  Building,
  CalendarDays,
  PenTool,
  ExternalLink,
  Bot
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  external?: boolean;
};

const mainNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "Órdenes", icon: FileText },
    { href: "/clients", label: "Clientes", icon: Contact },
    { href: "/schedule", label: "Calendario", icon: CalendarDays },
    { href: "/ai-guides", label: "Guías IA", icon: Bot },
];

const inventoryNavItems: NavItem[] = [
    { href: "/inventory/parts", label: "Repuestos", icon: Package },
    { href: "/inventory/suppliers", label: "Proveedores", icon: Truck },
];

const analyticsNavItems: NavItem[] = [
    { href: "/reports", label: "Reportes", icon: BarChart },
    { href: "/finance/income-report", label: "Ingresos", icon: TrendingUp },
    { href: "/finance/cashflow", label: "Flujo de Caja", icon: ArrowRightLeft },
];

const adminNavItems: NavItem[] = [
    { href: "/users", label: "Usuarios", icon: Users, adminOnly: true },
    { href: "/settings/branches", label: "Sucursales", icon: Building, adminOnly: true },
    { href: "https://www.figma.com/file/your-file-id/your-project-name", label: "Diseño (Figma)", icon: PenTool, adminOnly: false, external: true },
    { href: "/settings", label: "Configuración y Perfil", icon: Settings, adminOnly: false },
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

  const getRoleDisplayName = (role?: string) => {
    if (!role) return 'Usuario';
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      tecnico: 'Técnico',
      recepcionista: 'Recepcionista',
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };
  
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  const renderNavSection = (items: NavItem[], title?: string) => (
    <>
      {title && <span className="flex font-medium text-sm text-gray-400 px-4 my-2 uppercase group-data-[collapsible=icon]:hidden">{title}</span>}
      {items.filter(item => !item.adminOnly || user?.role === 'admin').map(item => {
          const Icon = item.icon;
          const active = !item.external && isActive(item.href);

          const buttonContent = (
            <SidebarMenuButton
              variant="ghost"
              className={cn(
                  "w-full justify-start space-x-4 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-gradient-to-r from-primary/10 to-primary/20 text-primary hover:text-primary font-semibold border-l-2 border-primary"
              )}
              tooltip={{ children: item.label }}
            >
              <Icon className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden flex-1">{item.label}</span>
              {item.external && <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground/70 group-data-[collapsible=icon]:hidden" />}
            </SidebarMenuButton>
          );

          return (
              <SidebarMenuItem key={item.href}>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="w-full block">
                        {buttonContent}
                    </a>
                  ) : (
                    <Link href={item.href} className="w-full block">
                        {buttonContent}
                    </Link>
                  )}
              </SidebarMenuItem>
          );
      })}
    </>
  );


  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="flex-col items-center justify-center p-4 text-center group-data-[collapsible=icon]:hidden">
            <Link href="/dashboard" className="mb-4 block" title="home">
                 <Smartphone className="h-10 w-10 mx-auto text-primary" />
            </Link>
            <Avatar className="w-24 h-24 m-auto">
                <AvatarImage src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.uid}`} alt={user?.name || "Avatar"} data-ai-hint="user avatar" />
                <AvatarFallback className="text-3xl">{user?.name?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <h5 className="mt-4 text-xl font-semibold text-foreground">{user?.name}</h5>
            <span className="text-sm text-muted-foreground">{getRoleDisplayName(user?.role)}</span>
        </SidebarHeader>
        
        {/* Collapsed view header */}
        <SidebarHeader className="items-center justify-center p-4 hidden group-data-[collapsible=icon]:flex">
            <Link href="/dashboard" className="block" title="home">
                <Smartphone className="h-8 w-8 text-primary" />
            </Link>
        </SidebarHeader>


        <SidebarContent>
            <SidebarMenu className="space-y-1 tracking-wide mt-2">
                {renderNavSection(mainNavItems, 'Principal')}
                {renderNavSection(inventoryNavItems, 'Inventario')}
                {renderNavSection(analyticsNavItems, 'Analítica')}
                {renderNavSection(adminNavItems, 'Administración')}
            </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} variant="ghost" className="w-full justify-start space-x-4 px-4 py-3 rounded-lg text-red-500/80 hover:text-red-500 hover:bg-red-500/10" tooltip={{ children: "Cerrar Sesión" }}>
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 shadow-sm backdrop-blur-sm sm:px-6">
            <div className="flex items-center">
                <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <NotificationBell />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10">
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
        <div className="fixed bottom-4 right-4 z-50 text-xs text-muted-foreground/50 pointer-events-none">
            Desarrollado por Yonathan Jesus Ocampo | +541130165093
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
