// src/components/orders/OrderListClient.tsx
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { Order, OrderStatus } from "@/types";
import { getOrders } from "@/lib/actions/order.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, FilterX, Search, Trash2, Edit } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

interface OrderListClientProps {
  initialOrders: Order[]; // These orders will now have clientName and clientLastName populated
  initialFilters: { client?: string, orderNumber?: string, imei?: string, status?: string };
}

const ALL_STATUSES_VALUE = "__ALL__"; 

export function OrderListClient({ initialOrders, initialFilters }: OrderListClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    client: initialFilters.client || "", // This filter text will search against the populated clientName/lastName
    orderNumber: initialFilters.orderNumber || "",
    imei: initialFilters.imei || "",
    status: initialFilters.status || "",
  });

  const fetchOrders = useCallback(async (currentFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const fetchedOrders = await getOrders(currentFilters);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    setFilters({
      client: params.get('client') || '',
      orderNumber: params.get('orderNumber') || '',
      imei: params.get('imei') || '',
      status: params.get('status') || '',
    });
  }, [searchParams]);


  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    if (filterName === 'status' && value === ALL_STATUSES_VALUE) {
      setFilters(prev => ({ ...prev, status: "" }));
    } else {
      setFilters(prev => ({ ...prev, [filterName]: value }));
    }
  };

  const applyFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (filters.client) params.set('client', filters.client);
      if (filters.orderNumber) params.set('orderNumber', filters.orderNumber);
      if (filters.imei) params.set('imei', filters.imei);
      if (filters.status) params.set('status', filters.status);
      router.push(`${pathname}?${params.toString()}`);
      fetchOrders(filters); 
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setFilters({ client: "", orderNumber: "", imei: "", status: "" });
      router.push(pathname);
      fetchOrders({ client: "", orderNumber: "", imei: "", status: "" }); 
    });
  };

  const getStatusBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "en reparación":
      case "listo para retirar":
        return "default"; 
      case "entregado":
        return "secondary";
      case "en diagnóstico":
      case "esperando pieza":
      case "ingreso":
        return "outline"; 
      case "abandonado":
        return "destructive";
      default:
        return "outline";
    }
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>Filtros de Búsqueda</CardTitle>
        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Input
            placeholder="Cliente (Nombre/Apellido)"
            value={filters.client}
            onChange={(e) => handleFilterChange("client", e.target.value)}
          />
          <Input
            placeholder="N° de Orden"
            value={filters.orderNumber}
            onChange={(e) => handleFilterChange("orderNumber", e.target.value)}
          />
          <Input
            placeholder="IMEI"
            value={filters.imei}
            onChange={(e) => handleFilterChange("imei", e.target.value)}
          />
          <Select value={filters.status === "" ? ALL_STATUSES_VALUE : filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES_VALUE}>Todos los Estados</SelectItem>
              {ORDER_STATUSES.filter(opt => opt !== "").map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={applyFilters} disabled={isPending || isLoading} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
            <Button onClick={clearFilters} variant="outline" disabled={isPending || isLoading} className="w-full sm:w-auto">
              <FilterX className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner size={32}/>
            <p className="ml-2">Cargando órdenes...</p>
          </div>
        )}
        {!isLoading && orders.length === 0 && (
          <div className="py-10 text-center text-muted-foreground">
            No se encontraron órdenes con los filtros aplicados.
          </div>
        )}
        {!isLoading && orders.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Falla Declarada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Ingreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.clientName} {order.clientLastName}</TableCell>
                    <TableCell>{order.deviceBrand} {order.deviceModel}</TableCell>
                    <TableCell className="max-w-xs truncate">{order.declaredFault}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.entryDate), "dd MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver Orden</span>
                        </Link>
                      </Button>
                       <Button asChild variant="ghost" size="icon">
                        <Link href={`/orders/${order.id}?edit=true`}>
                          <Edit className="h-4 w-4" />
                           <span className="sr-only">Editar Orden</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
