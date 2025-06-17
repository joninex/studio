
// src/components/layout/AppShell.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  SidebarMenuBadge,
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
  Menu,
  Briefcase,
  Smartphone,
  Wrench,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";

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
  { href: "/users", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/settings", label: "Configuración", icon: Settings, adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();

  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  useEffect(() => {
    // Determine active parent menu for sub-menu highlighting
    const parentPath = navItems.find(item => item.subItems?.some(sub => pathname.startsWith(sub.href)))?.href;
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

  const renderNavItems = (items: NavItem[], isSubMenu = false) => {
    return items.map((item) => {
      const isActive = item.subItems ? pathname.startsWith(item.href) : pathname === item.href;
      const Icon = item.icon;

      if (item.subItems) {
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              onClick={() => setActiveSubMenu(activeSubMenu === item.href ? null : item.href)}
              isActive={isActive || activeSubMenu === item.href}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                <Icon />
                <span>{item.label}</span>
              </div>
              <ChevronDown className={`transition-transform duration-200 ${activeSubMenu === item.href ? 'rotate-180' : ''}`} />
            </SidebarMenuButton>
            {activeSubMenu === item.href && (
              <SidebarMenu className="pl-4 pt-1">
                {renderNavItems(item.subItems.filter(subItem => !subItem.adminOnly || (user?.role === 'admin')), true)}
              </SidebarMenu>
            )}
          </SidebarMenuItem>
        );
      }

      return (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton isActive={isActive} asChild={!isSubMenu} className={isSubMenu ? 'text-sm' : ''}>
              {!isSubMenu ? (
                // When asChild is true, Slot passes props (like className, data-attributes) to this div.
                // This div needs to layout Icon and label using its own flex properties.
                // The className from SidebarMenuButton (including w-full, p-2 etc.) gets merged onto this div.
                <div className="flex items-center gap-2"> 
                  <Icon />
                  <span>{item.label}</span>
                </div>
              ) : (
                // When asChild is false, SidebarMenuButton is a real button.
                // The button itself has flex and gap, so Fragment is fine for its children.
                <>
                  <Icon />
                  <span>{item.label}</span>
                </>
              )}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      );
    });
  };


  return (
    <SidebarProvider defaultOpen={!isMobile} open={isMobile ? undefined : undefined}>
      <Sidebar side="left" variant="sidebar" collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader className="border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 p-2 hover:no-underline">
            <Smartphone className="h-8 w-8 text-primary" /> {/* Changed icon */}
            <h1 className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              JO-SERVICE
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
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm sm:px-6">
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
                    <AvatarImage src={user?.uid ? `https://i.pravatar.cc/150?u=${user.uid}` : "https://placehold.co/40x40.png"} alt={user?.name || undefined} data-ai-hint="user avatar" />
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
