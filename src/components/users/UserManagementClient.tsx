// src/components/users/UserManagementClient.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import type { User, UserStatus, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, Search, UserPlus, CheckCircle, XCircle, Clock, Truck, Briefcase, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSchema } from "@/lib/schemas";
import type { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/actions/user.actions";
import { Badge } from "@/components/ui/badge";
import { USER_ROLES_VALUES } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export function UserManagementClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof UserSchema>>({
    resolver: zodResolver(UserSchema),
    defaultValues: { name: "", email: "", role: "tecnico", sector: "", password: "", avatarUrl: "" },
  });

  async function loadUsers() {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los usuarios."});
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFormSubmit = (values: z.infer<typeof UserSchema>) => {
    startTransition(async () => {
      let result;
      if (editingUser) {
        const updateData: Partial<z.infer<typeof UserSchema>> = {...values};
        if (!values.password || values.password.trim() === "") {
          delete updateData.password;
        }
        result = await updateUser(editingUser.uid, updateData);
      } else {
        result = await createUser(values);
      }

      if (result.success) {
        toast({ title: "Éxito", description: result.message });
        setIsFormOpen(false);
        setEditingUser(null);
        form.reset({ name: "", email: "", role: "tecnico", sector: "", password: "", avatarUrl: "" });
        await loadUsers();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    const userSector = user.assignments && user.assignments.length > 0
      ? user.assignments.map(a => a.sector).join(', ')
      : "";
    form.reset({ name: user.name, email: user.email, role: user.role, sector: userSector, password: "", avatarUrl: user.avatarUrl || "" });
    setIsFormOpen(true);
  };

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    startTransition(async () => {
      const result = await deleteUser(userToDelete.uid);
       if (result.success) {
        toast({ title: "Éxito", description: result.message });
        await loadUsers();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setIsAlertOpen(false);
      setUserToDelete(null);
    });
  };

  const openNewUserForm = () => {
    setEditingUser(null);
    form.reset({ name: "", email: "", role: "tecnico", sector: "", password: "", avatarUrl: "" });
    setIsFormOpen(true);
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3"/>Activo</Badge>;
      case "denied":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Denegado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      admin: 'Administrador',
      tecnico: 'Técnico',
      recepcionista: 'Recepcionista',
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };
  
  const getRoleBadgeVariant = (role: UserRole): "default" | "secondary" | "outline" | "destructive" => {
    switch (role) {
      case 'admin': return 'default'; // Primary color
      case 'tecnico': return 'secondary'; // Secondary color
      case 'recepcionista': return 'outline'; 
      default: return 'outline';
    }
  };


  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    <Card className="shadow-xl">
      <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <CardTitle>Listado de Usuarios</CardTitle>
            <CardDescription>Administre los usuarios del sistema.</CardDescription>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nombre o email..."
                    className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button onClick={openNewUserForm}>
             <UserPlus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10"><LoadingSpinner size={32}/> <p className="ml-2">Cargando usuarios...</p></div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No se encontraron usuarios.</p>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Sector(es)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                       <AvatarImage 
                          src={user.avatarUrl || (user.uid ? `https://i.pravatar.cc/150?u=${user.uid}` : "https://placehold.co/40x40.png")} 
                          alt={user.name} 
                          data-ai-hint="user avatar"
                       />
                       <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                     <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    {user.assignments && user.assignments.length > 0
                      ? user.assignments.map(a => a.sector).join(', ')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} title="Editar Usuario"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDeleteUser(user)} disabled={user.email === 'jesus@mobyland.com.ar'} title="Eliminar Usuario">
                      <Trash2 className="h-4 w-4 text-destructive" />
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

    <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) {
            setEditingUser(null);
            form.reset({ name: "", email: "", role: "tecnico", sector: "", password: "", avatarUrl: "" });
        }
    }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Modifique los detalles del usuario." : "Complete los datos para crear un nuevo usuario."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Nombre Apellido" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="usuario@ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><ImageIcon className="h-4 w-4"/> URL de Avatar (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://ejemplo.com/avatar.png" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                      Ingrese la URL completa de una imagen para el avatar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value as UserRole}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un rol" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {USER_ROLES_VALUES.map(roleValue => (
                        <SelectItem key={roleValue} value={roleValue}>
                          {getRoleDisplayName(roleValue)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector(es)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Laboratorio, Mostrador" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                      Puede asignar múltiples sectores separados por coma.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Contraseña {editingUser ? "(Dejar en blanco para no cambiar)" : ""}</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isPending}>
                  {isPending && <LoadingSpinner size={16} className="mr-2"/>}
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario: <strong className="break-all">{userToDelete?.name} ({userToDelete?.email})</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending && <LoadingSpinner size={16} className="mr-2"/>}
              Sí, eliminar usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
