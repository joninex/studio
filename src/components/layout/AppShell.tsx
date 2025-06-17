// src/components/layout/AppShell.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  PlusCircle,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Contact,
  Archive, 
  List, 
  Truck, 
  Landmark, 
  ArrowRightLeft, 
  TrendingUp, 
  BarChartBig, 
  Lightbulb,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/orders",
    label: "Órdenes de Servicio",
    icon: FileText,
    subItems: [
      { href: "/orders", label: "Ver Órdenes", icon: FileText },
      { href: "/orders/new", label: "Nueva Orden", icon: PlusCircle },
    ],
  },
  { href: "/clients", label: "Clientes", icon: Contact },
  {
    href: "/inventory",
    label: "Inventario",
    icon: Archive,
    subItems: [
      { href: "/inventory/parts", label: "Ver Repuestos", icon: List },
      { href: "/inventory/parts/new", label: "Añadir Repuesto", icon: PlusCircle },
      { href: "/inventory/suppliers", label: "Proveedores", icon: Truck },
    ],
  },
  {
    href: "/finance",
    label: "Finanzas",
    icon: Landmark,
    subItems: [
      { href: "/finance/cashflow", label: "Movimientos de Caja", icon: ArrowRightLeft },
      { href: "/finance/income-report", label: "Reporte de Ingresos", icon: TrendingUp },
    ],
  },
  { href: "/reports", label: "Reportes", icon: BarChartBig },
  { href: "/ai-guides", label: "Guías IA", icon: Lightbulb },
  { href: "/users", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();

  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  useEffect(() => {
    const findParentPath = (items: NavItem[], currentPath: string): string | null => {
      for (const item of items) {
        if (item.subItems) {
          if (item.subItems.some(sub => currentPath.startsWith(sub.href))) {
            return item.href;
          }
          const nestedParentPath = findParentPath(item.subItems, currentPath);
          if (nestedParentPath) {
            const topLevelParent = items.find(topItem => topItem.subItems?.some(sub => sub.href === nestedParentPath));
            return topLevelParent?.href || item.href;
          }
        }
      }
      return null;
    };
    const parentPath = findParentPath(navItems, pathname);
    if (parentPath) {
      setActiveSubMenu(parentPath);
    } else {
       setActiveSubMenu(null); 
    }
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
  };
  
  const filteredNavItems = navItems.filter(item => !item.adminOnly || (user?.role === 'admin'));

  const renderNavItems = (items: NavItem[], level = 0): React.ReactNodeArray => {
    return items.map((item) => {
      const isLinkActive = pathname === item.href;
      const isParentOfActivePath = item.subItems?.some(sub => pathname.startsWith(sub.href)) || false;
      const isActive = isLinkActive || isParentOfActivePath;
      
      const Icon = item.icon;

      if (item.subItems) {
        const isSubMenuOpen = activeSubMenu === item.href;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              onClick={() => setActiveSubMenu(isSubMenuOpen ? null : item.href)}
              isActive={isActive} 
              className="justify-between"
              aria-expanded={isSubMenuOpen}
            >
              <div className="flex items-center gap-2">
                <Icon />
                <span>{item.label}</span>
              </div>
              <ChevronDown 
                className={`transition-transform duration-200 ${isSubMenuOpen ? 'rotate-180' : ''}`} 
              />
            </SidebarMenuButton>
            {isSubMenuOpen && (
              <SidebarMenu className={`pl-${(level + 1) * 2} pt-1`}> 
                {renderNavItems(item.subItems.filter(subItem => !subItem.adminOnly || (user?.role === 'admin')), level + 1)}
              </SidebarMenu>
            )}
          </SidebarMenuItem>
        );
      }

      return (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton 
              asChild={false} 
              isActive={isLinkActive} 
              className={level > 0 ? `pl-${level * 2}` : ''} 
            >
              <div className="flex items-center gap-2 w-full">
                <Icon />
                <span>{item.label}</span>
              </div>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      );
    });
  };
  
  const effectiveCompanyName = user?.storeSettings?.companyName || DEFAULT_STORE_SETTINGS.companyName;
  const effectiveCompanyLogoUrl = user?.storeSettings?.companyLogoUrl || DEFAULT_STORE_SETTINGS.companyLogoUrl;

  return (
    <SidebarProvider defaultOpen={!isMobile} open={isMobile ? undefined : undefined}>
      <Sidebar side="left" variant="sidebar" collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader className="border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 p-2 hover:no-underline min-h-[56px]">
            {effectiveCompanyLogoUrl ? ( 
              <Image
                src={effectiveCompanyLogoUrl}
                alt={`${effectiveCompanyName || 'Logo'} Logo`}
                width={32} 
                height={32}
                className="object-contain h-8 w-8" 
                data-ai-hint={effectiveCompanyLogoUrl.includes("placehold.co") ? "company logo placeholder" : "company logo"}
              />
            ) : (
              <Smartphone className="h-8 w-8 text-primary" /> 
            )}
            <h1 className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              { (effectiveCompanyName && effectiveCompanyName !== DEFAULT_STORE_SETTINGS.companyName) ? effectiveCompanyName.split(' ')[0] : "JO-SERVICE" }
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {renderNavItems(filteredNavItems)}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
            <Button variant="ghost" className="w-full justify-start gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-2" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
            </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm sm:px-6 sidebar-inset-header">
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block">
              {/* Could put breadcrumbs or page title here */}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={user?.avatarUrl || (user?.uid ? `https://i.pravatar.cc/150?u=${user.uid}` : "https://placehold.co/40x40.png")} 
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
                      {user?.email} ({user?.role})
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

