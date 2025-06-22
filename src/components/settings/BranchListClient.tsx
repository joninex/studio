// src/components/settings/BranchListClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { Branch } from "@/types";
import { deleteBranch } from "@/lib/actions/branch.actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface BranchListClientProps {
  branches: Branch[];
}

export function BranchListClient({ branches: initialBranches }: BranchListClientProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const handleDeleteBranch = () => {
    if (!branchToDelete) return;
    startDeleteTransition(async () => {
      const result = await deleteBranch(branchToDelete.id);
      if (result.success) {
        setBranches(prev => prev.filter(b => b.id !== branchToDelete.id));
        toast({ title: "Éxito", description: "Sucursal eliminada." });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setBranchToDelete(null); 
    });
  };

  return (
    <>
      <Card className="shadow-xl">
        <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.address}</TableCell>
                      <TableCell>
                        <Badge variant={branch.status === 'active' ? 'default' : 'destructive'} className={branch.status === 'active' ? 'bg-green-600' : ''}>
                          {branch.status === 'active' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                          {branch.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {branch.createdAt ? format(new Date(branch.createdAt as string), "dd MMM yyyy", { locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" title="Editar Sucursal">
                          <Link href={`/settings/branches/${branch.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                         <Button variant="ghost" size="icon" title="Eliminar Sucursal" onClick={() => setBranchToDelete(branch)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta sucursal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la sucursal: <strong>{branchToDelete?.name}</strong>. Asegúrese de que no tenga órdenes o usuarios activos asignados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBranchToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBranch} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <LoadingSpinner size={16} className="mr-2"/>}
              Sí, eliminar sucursal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
