// src/components/resources/ResourceCard.tsx
"use client";

import type { ResourceItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Star, ExternalLink, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { DEFAULT_CATEGORY_ICONS, RESOURCE_CATEGORY_LABELS } from "@/lib/resource-utils"; // Importar

interface ResourceCardProps {
  resource: ResourceItem;
  isFavorite: boolean;
  onToggleFavorite: (resourceId: string) => void;
}

export function ResourceCard({ resource, isFavorite, onToggleFavorite }: ResourceCardProps) {
  const IconComponent = resource.icon || DEFAULT_CATEGORY_ICONS[resource.category];
  const categoryLabel = RESOURCE_CATEGORY_LABELS[resource.category] || resource.category.replace(/-/g, " ");


  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0"> {/* min-w-0 para permitir que el título se trunque si es largo */}
            {IconComponent && <IconComponent aria-hidden="true" className="h-5 w-5 text-primary shrink-0" />}
            <CardTitle className="text-lg font-semibold text-primary truncate" title={resource.name}> {/* Truncate y title para nombres largos */}
              {resource.name}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(resource.id)}
            aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            className="text-muted-foreground hover:text-yellow-500 shrink-0"
          >
            <Star className={`h-5 w-5 ${isFavorite ? "fill-yellow-400 text-yellow-500" : "text-gray-300"}`} /> {/* Color base para estrella no favorita */}
          </Button>
        </div>
        <CardDescription className="text-xs text-muted-foreground pt-1 capitalize">
          {categoryLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow py-3"> {/* Ajuste de padding */}
        <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t mt-auto"> {/* Ajuste de padding */}
        <div className="flex flex-wrap gap-1 mb-3 sm:mb-0">
          {resource.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href={resource.url} target="_blank" rel="noopener noreferrer">
            Visitar
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
