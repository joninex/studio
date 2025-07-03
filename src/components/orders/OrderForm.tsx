// src/components/orders/OrderForm.tsx
"use client";

import { useForm, useFieldArray } from "react-hook-form"; // Controller no se usa directamente
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useMemo } from "react";

import { OrderSchema, type OrderFormData } from "@/lib/schemas";
import { createOrder, updateOrder, getOrderById } from "@/lib/actions/order.actions";
import { getClientById } from "@/lib/actions/client.actions";
import { getBranches, type Branch } from "@/lib/actions/branch.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider"; // Importante para el idToken
import { type Checklist, type Part, type Client } from "@/types"; // Order y Branch ya están en otros imports
import { CHECKLIST_ITEMS, YES_NO_OPTIONS, LEGAL_TEXTS } from "@/lib/constants";
import { AlertCircle, Building, DollarSign, InfoIcon, ListChecks, User, Wrench, Clock, Lock, LockOpen, Package, PackagePlus, Trash2, Edit } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DeclaredFaultInput } from "./DeclaredFaultInput";
import { PartSelector } from "./PartSelector";
import { ClientSelector } from "./ClientSelector";
import { ClientEditModal } from "../clients/ClientEditModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RichTextEditor } from "@/components/shared/RichTextEditor";


const FUNCTIONAL_CHECKLIST_IDS = CHECKLIST_ITEMS
    .filter(item => item.group !== 'Estado Físico' && item.type === 'boolean')
    .map(item => `checklist.${item.id}`);

interface OrderFormProps {
  orderId?: string;
}

export function OrderForm({ orderId }: OrderFormProps) {
  const { user, getIdToken } = useAuth(); // Obtener getIdToken
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(!!orderId);
  const [isPartSelectorOpen, setIsPartSelectorOpen] = useState(false);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isClientEditModalOpen, setIsClientEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const defaultUserBranchId = useMemo(() => {
    if (user && user.role !== 'admin' && user.assignments && user.assignments.length > 0) {
        return user.assignments[0].branchId;
    }
    return undefined;
  }, [user]);

  const defaultChecklistValues = CHECKLIST_ITEMS.reduce((acc, item) => {
    (acc as any)[item.id] = item.type === 'boolean' ? 'sc' : '';
    return acc;
  }, {} as OrderFormData['checklist']);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      branchId: defaultUserBranchId || "",
      clientId: "", deviceBrand: "", deviceModel: "", deviceIMEI: "", declaredFault: "",
      imeiNotVisible: false,
      unlockPatternProvided: true,
      checklist: defaultChecklistValues,
      damageRisk: "", costSparePart: 0, costLabor: 0,
      observations: "",
      estimatedCompletionTime: "",
      partsUsed: [],
    },
  });
  
  const watchedBranchId = form.watch("branchId");
  const unlockPatternProvided = form.watch("unlockPatternProvided");
  const imeiNotVisible = form.watch("imeiNotVisible");
  const partsUsed = form.watch("partsUsed");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "partsUsed",
  });

  // Helper para obtener idToken
  const getToken = async () => {
    if (!user || !getIdToken) {
      toast({ variant: "destructive", title: "Error de Autenticación", description: "Usuario no autenticado." });
      return null;
    }
    try {
      const token = await getIdToken();
      if (!token) {
        toast({ variant: "destructive", title: "Error de Autenticación", description: "No se pudo obtener el token. Intente re-iniciar sesión." });
        return null;
      }
      return token;
    } catch (error) {
      toast({ variant: "destructive", title: "Error de Autenticación", description: "No se pudo obtener el token de usuario." });
      return null;
    }
  };

  useEffect(() => {
    if (partsUsed) {
      const totalCost = partsUsed.reduce((sum, part) => sum + (part.unitPrice * part.quantity), 0);
      form.setValue("costSparePart", totalCost, { shouldValidate: true });
    }
  }, [partsUsed, form]);

  useEffect(() => {
    if (!unlockPatternProvided) {
        FUNCTIONAL_CHECKLIST_IDS.forEach(id => {
            form.setValue(id as keyof OrderFormData, 'sc');
        });
    }
  }, [unlockPatternProvided, form]);

  useEffect(() => {
    if (user?.role === 'admin') {
        getBranches().then(fetchedBranches => {
            setBranches(fetchedBranches);
            if (!orderId && fetchedBranches.length === 1 && !form.getValues("branchId")) {
                form.setValue('branchId', fetchedBranches[0].id, { shouldValidate: true });
            }
        }).catch(err => {
            console.error("Error fetching branches:", err);
            toast({ variant: "destructive", title: "Error al cargar sucursales", description: (err as Error).message || "No se pudieron cargar las sucursales." });
        });
    }

    if (orderId) {
      setIsLoadingInitialData(true);
      // getOrderById no necesita token ya que es una lectura que no depende del usuario logueado directamente,
      // sino del ID de la orden. La seguridad de quién puede ver qué orden se manejaría en la página que lista las órdenes.
      getOrderById(orderId)
        .then(async (orderDataResult) => {
          if (orderDataResult) {
            form.reset(orderDataResult);
            if (orderDataResult.clientId) {
              return getClientById(orderDataResult.clientId)
                .then(clientDataResult => {
                  if (clientDataResult) {
                    setSelectedClient(clientDataResult);
                  } else {
                    toast({ variant: "warning", title: "Advertencia", description: `No se encontró el cliente con ID ${orderDataResult.clientId} asociado a la orden.` });
                  }
                })
                .catch(clientError => {
                  console.error("Error fetching client for order:", clientError);
                  toast({ variant: "destructive", title: "Error al cargar cliente", description: "No se pudo cargar el cliente asociado a la orden." });
                });
            }
          } else {
            toast({ variant: "destructive", title: "Error", description: `No se encontró la orden con ID ${orderId}. Es posible que haya sido eliminada.` });
            // Considerar redirigir si la orden no existe y el usuario no debería estar aquí
            // router.push("/orders");
          }
        })
        .catch(orderError => {
          console.error("Error fetching order:", orderError);
          toast({ variant: "destructive", title: "Error al cargar orden", description: (orderError as Error).message || "No se pudo cargar la información de la orden." });
        })
        .finally(() => setIsLoadingInitialData(false));
    } else {
        if (user?.role !== 'admin' && defaultUserBranchId) {
            form.setValue('branchId', defaultUserBranchId);
        }
        setIsLoadingInitialData(false);
    }
  }, [orderId, form, user, defaultUserBranchId, toast, router]); // Añadido router


  const onSubmit = async (values: OrderFormData) => { // onSubmit ahora es async
    const idToken = await getToken();
    if (!idToken) return; // getToken ya muestra el toast

    const branchForOrder = values.branchId;
    if (!branchForOrder) {
        toast({ variant: "destructive", title: "Error", description: "Debe seleccionar o tener asignada una sucursal para la orden." });
        return;
    }

    startTransition(async () => {
      let result;
      // El userNameForAction se obtiene en el backend a partir del idToken
      if (orderId) {
        result = await updateOrder({ idToken, orderId, values });
      } else {
        result = await createOrder({ idToken, values, branchIdFromUserContext: branchForOrder });
      }

      if (result.success && result.order?.id) {
        toast({ title: "Éxito", description: result.message });
        router.push(`/orders/${result.order.id}`);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message || "Ocurrió un error." });
      }
    });
  };

  const handleSelectPart = (part: Part) => {
    append({
      partId: part.id,
      partName: part.name,
      quantity: 1,
      unitPrice: part.salePrice,
      costPrice: part.costPrice,
    });
  };

  const handleSelectClient = (client: Client) => {
    form.setValue("clientId", client.id, { shouldValidate: true });
    setSelectedClient(client);
  };
  
  const handleClientUpdate = (updatedClient: Client) => {
    setSelectedClient(updatedClient);
  };

  if (isLoadingInitialData && orderId) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={48}/> <p className="ml-4">Cargando orden...</p></div>;
  }
  
  const checklistGroups = CHECKLIST_ITEMS.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {} as Record<string, typeof CHECKLIST_ITEMS>);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {user?.role === 'admin' && !orderId && (
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Building className="text-primary"/> Sucursal de la Orden</CardTitle></CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="branchId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Asignar a Sucursal</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger disabled={branches.length === 0}>
                                            <SelectValue placeholder={branches.length > 0 ? "Seleccione una sucursal" : (isLoadingInitialData ? "Cargando..." : "No hay sucursales")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {branches.length === 0 && !isLoadingInitialData && <SelectItem value="" disabled>No hay sucursales disponibles</SelectItem>}
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    La orden será creada y gestionada bajo esta sucursal.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        )}
        { (user?.role !== 'admin' || orderId ) && (
            <FormField control={form.control} name="branchId" render={({ field }) => ( <FormItem className="hidden"><FormControl><Input type="hidden" {...field} /></FormControl></FormItem> )} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="text-primary"/> Datos del Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <FormField control={form.control} name="clientId" render={({ field }) => ( 
                    <FormItem>
                       <FormLabel>Cliente Seleccionado</FormLabel>
                       <FormControl>
                            <Input type="hidden" {...field} />
                       </FormControl>
                       <div className="p-4 border rounded-md min-h-[80px] bg-muted/30 flex items-center justify-between flex-wrap gap-2">
                            {selectedClient ? (
                                <div>
                                    <p className="font-semibold">{selectedClient.name} {selectedClient.lastName}</p>
                                    <p className="text-sm text-muted-foreground">DNI: {selectedClient.dni}</p>
                                    <p className="text-sm text-muted-foreground">Tel: {selectedClient.phone}</p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Ningún cliente seleccionado.</p>
                            )}
                            <div className="flex items-center gap-2">
                                {selectedClient && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsClientEditModalOpen(true)}>
                                        <Edit className="mr-2 h-4 w-4"/> Editar
                                    </Button>
                                )}
                                <Button type="button" variant="outline" onClick={() => {
                                    if (!watchedBranchId && user?.role === 'admin' && !orderId) { // Solo verificar al crear
                                        toast({variant: "destructive", title:"Seleccione Sucursal", description: "Por favor, seleccione una sucursal antes de elegir un cliente."});
                                        return;
                                    }
                                    setIsClientSelectorOpen(true)
                                }}>
                                    {selectedClient ? "Cambiar" : "Seleccionar"}
                                </Button>
                            </div>
                       </div>
                       <FormMessage />
                    </FormItem> 
                 )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="text-primary"/> Detalles del Equipo y Falla</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="deviceBrand" render={({ field }) => ( <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ej: Samsung, Apple" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="deviceModel" render={({ field }) => ( <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ej: Galaxy S21, iPhone 13" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="deviceIMEI" render={({ field }) => ( <FormItem><FormLabel>IMEI/Serial</FormLabel><FormControl><Input placeholder="IMEI o N° Serie del equipo" {...field} disabled={imeiNotVisible} /></FormControl><FormMessage /></FormItem> )} />
                <FormField
                    control={form.control}
                    name="imeiNotVisible"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                         <FormLabel className="font-normal text-sm">
                            IMEI/Serie no visible/accesible al ingreso
                        </FormLabel>
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="declaredFault"
                  render={() => (
                    <FormItem>
                      <FormLabel>Falla Declarada por el Cliente</FormLabel>
                      <FormControl>
                        <DeclaredFaultInput />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary"/> Checklist de Recepción</CardTitle>
                <CardDescription>
                    <InfoIcon className="inline h-4 w-4 mr-1"/>
                    {LEGAL_TEXTS.checklistDisclaimer}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="unlockPatternProvided"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/30">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2">
                                {field.value ? <LockOpen className="text-green-600"/> : <Lock className="text-destructive"/>}
                                ¿Autoriza acceso al sistema con clave/patrón?
                            </FormLabel>
                            <FormDescription>
                                Requerido para probar todas las funciones internas.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />
                
                {!unlockPatternProvided && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atención: Funciones no comprobadas</AlertTitle>
                        <AlertDescription>{LEGAL_TEXTS.noUnlockCodeDisclaimer}</AlertDescription>
                    </Alert>
                )}

                 {Object.entries(checklistGroups).map(([groupName, items]) => {
                    const isFunctionalGroup = items.some(item => FUNCTIONAL_CHECKLIST_IDS.includes(`checklist.${item.id}`));
                    const isDisabled = isFunctionalGroup && !unlockPatternProvided;

                    return (
                        <div key={groupName}>
                            <h4 className="font-semibold mb-2 text-md text-primary/90">{groupName}</h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                                {items.map(item => (
                                <FormField
                                    key={item.id}
                                    control={form.control}
                                    name={`checklist.${item.id as keyof Checklist}`}
                                    render={({ field }) => (
                                    <FormItem className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-2 shadow-sm gap-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <FormLabel className="text-sm font-normal shrink-0">{item.label}</FormLabel>
                                        <FormControl>
                                        {item.type === 'boolean' ? (
                                            <RadioGroup 
                                                onValueChange={field.onChange} 
                                                value={field.value as string} 
                                                defaultValue="sc" 
                                                className="flex space-x-2"
                                                disabled={isDisabled}
                                            >
                                            {YES_NO_OPTIONS.map(opt => (
                                                <FormItem key={opt.value} className="flex items-center space-x-1 space-y-0">
                                                <FormControl><RadioGroupItem value={opt.value} disabled={isDisabled} /></FormControl>
                                                <FormLabel className={`font-normal text-xs ${isDisabled ? 'cursor-not-allowed' : ''}`}>{opt.label}</FormLabel>
                                                </FormItem>
                                            ))}
                                            </RadioGroup>
                                        ) : (
                                            <Input type="text" {...field} className="h-8 text-xs w-full sm:w-24"/>
                                        )}
                                        </FormControl>
                                    </FormItem>
                                    )}
                                />
                                ))}
                            </div>
                        </div>
                    );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="text-primary"/> Riesgos y Observaciones</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="damageRisk" render={({ field }) => ( <FormItem><FormLabel>Daños físicos preexistentes</FormLabel><FormControl><Textarea placeholder="Describa daños específicos: marco, pantalla, tapa, etc." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField 
                  control={form.control} 
                  name="observations" 
                  render={({ field }) => ( 
                    <FormItem>
                      <FormLabel>Accesorios y Observaciones Adicionales (Diagnóstico)</FormLabel>
                      <FormControl>
                        <RichTextEditor 
                          content={field.value || ""} 
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Use este editor para diagnósticos técnicos, observaciones detalladas o cualquier información relevante.
                      </FormDescription>
                      <FormMessage />
                    </FormItem> 
                  )} 
                />
                <FormField control={form.control} name="estimatedCompletionTime" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-1"><Clock className="h-4 w-4"/>Hora Estimada de Finalización</FormLabel><FormControl><Input placeholder="Ej: 18:00hs, Fin del día" {...field} /></FormControl><FormDescription>Esta hora se usará en las notificaciones al cliente.</FormDescription><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Package className="text-primary"/> Repuestos Utilizados</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsPartSelectorOpen(true)}>
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Agregar Repuesto
                    </Button>
                </CardTitle>
                <CardDescription>Repuestos que se incluirán en el presupuesto.</CardDescription>
              </CardHeader>
              <CardContent>
                {fields.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50%]">Nombre</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.partName}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                className="h-8 w-20"
                                {...form.register(`partsUsed.${index}.quantity` as const, {
                                  valueAsNumber: true,
                                })}
                              />
                              <FormMessage>{form.formState.errors.partsUsed?.[index]?.quantity?.message}</FormMessage>
                            </TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>${(item.unitPrice * (form.watch(`partsUsed.${index}.quantity`) || 0)).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No se han agregado repuestos.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-primary"/> Costos y Presupuesto</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <FormField control={form.control} name="costSparePart" render={({ field }) => ( <FormItem><FormLabel>Costo Total Repuestos ($)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled /></FormControl><FormDescription>Este valor se calcula automáticamente.</FormDescription><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="costLabor" render={({ field }) => ( <FormItem><FormLabel>Costo Mano de Obra ($)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem> )} />
                <div className="p-4 bg-muted rounded-lg text-right">
                    <p className="text-sm text-muted-foreground">PRESUPUESTO TOTAL ESTIMADO</p>
                    <p className="text-2xl font-bold text-primary">${(form.watch("costSparePart") + form.watch("costLabor")).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
        </div>
        
        <Separator />
        
        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto" disabled={isPending || isLoadingInitialData || (user?.role === 'admin' && !orderId && !watchedBranchId) }>
            {(isPending || isLoadingInitialData) && <LoadingSpinner size={16} className="mr-2"/>}
            {orderId ? "Actualizar Orden" : "Crear Orden de Servicio"}
          </Button>
        </div>
      </form>

      <PartSelector
        isOpen={isPartSelectorOpen}
        onOpenChange={setIsPartSelectorOpen}
        onSelectPart={handleSelectPart}
        currentParts={fields.map(f => f.partId)}
      />
      {watchedBranchId && (
        <ClientSelector
          isOpen={isClientSelectorOpen}
          onOpenChange={setIsClientSelectorOpen}
          onSelectClient={handleSelectClient}
          branchId={watchedBranchId}
        />
      )}
      {(selectedClient && watchedBranchId) && (
        <ClientEditModal
            isOpen={isClientEditModalOpen}
            onOpenChange={setIsClientEditModalOpen}
            client={selectedClient}
            onClientUpdate={handleClientUpdate}
        />
      )}
    </Form>
  );
}
