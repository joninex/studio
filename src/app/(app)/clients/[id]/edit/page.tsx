// src/app/(app)/clients/[id]/edit/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/ClientForm";
import { getClientById } from "@/lib/actions/client.actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0; // Revalidate on every request for dynamic data

interface EditClientPageProps {
  params: { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const clientId = params.id;
  const client = await getClientById(clientId);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editando Cliente: ${client.name} ${client.lastName}`}
        description="Modifique los detalles del cliente."
        actions={
          <Link href="/clients" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Listado
            </Button>
          </Link>
        }
      />
      <Card className="shadow-xl">
        <CardContent className="p-6">
          <ClientForm clientId={clientId} initialData={client} />
        </CardContent>
      </Card>
    </div>
  );
}
