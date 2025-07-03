// src/app/gori/resources/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import type { ResourceItem, ResourceCategory } from "@/types";
import { RESOURCES_DATA } from "@/lib/resources";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListFilter, Search, StarOff, StarIcon, XIcon } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce"; // Importar useDebounce

const ALL_CATEGORIES_VALUE = "all-categories";

export default function GoriResourcesPage() {
  const [inputValue, setInputValue] = useState(""); // Para el input directo
  const debouncedSearchTerm = useDebounce(inputValue, 300); // Debounce de 300ms
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | typeof ALL_CATEGORIES_VALUE>(ALL_CATEGORIES_VALUE);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedFavorites = localStorage.getItem("goriResourceFavorites");
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(new Set(parsedFavorites));
        } else {
          localStorage.removeItem("goriResourceFavorites");
        }
      } catch (e) {
        console.error("Error parsing favorites from localStorage:", e);
        localStorage.removeItem("goriResourceFavorites");
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("goriResourceFavorites", JSON.stringify(Array.from(favorites)));
    }
  }, [favorites, isClient]);

  const handleToggleFavorite = (resourceId: string) => {
    setFavorites((prevFavorites) => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(resourceId)) {
        newFavorites.delete(resourceId);
      } else {
        newFavorites.add(resourceId);
      }
      return newFavorites;
    });
  };

  const uniqueCategories = useMemo(() => {
    const categories = new Set<ResourceCategory>();
    RESOURCES_DATA.forEach(resource => categories.add(resource.category));
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredResources = useMemo(() => {
    let resources = RESOURCES_DATA;

    if (showOnlyFavorites) {
      resources = resources.filter(resource => favorites.has(resource.id));
    }

    if (selectedCategory !== ALL_CATEGORIES_VALUE) {
      resources = resources.filter(resource => resource.category === selectedCategory);
    }

    // Usar debouncedSearchTerm para el filtrado
    if (debouncedSearchTerm.trim() !== "") {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      resources = resources.filter(resource =>
        resource.name.toLowerCase().includes(lowerSearchTerm) ||
        resource.description.toLowerCase().includes(lowerSearchTerm) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return resources;
  }, [debouncedSearchTerm, selectedCategory, favorites, showOnlyFavorites]); // Añadir debouncedSearchTerm a las dependencias

  const clearAllFilters = () => {
    setInputValue("");
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setShowOnlyFavorites(false);
  };

  if (!isClient) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
        Cargando Centro de Recursos...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">Centro de Recursos GORI</h1>
        <p className="mt-2 text-md sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Una colección curada de herramientas y recursos para potenciar tu desarrollo y eficiencia.
        </p>
      </header>

      <div className="mb-8 p-4 sm:p-6 bg-card border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2"> {/* Input de búsqueda ocupa más espacio */}
            <label htmlFor="search-resources" className="block text-sm font-medium text-muted-foreground mb-1">
              Buscar Recurso
            </label>
            <div className="relative">
              <Input
                id="search-resources"
                type="text"
                placeholder="Nombre, tag, descripción..."
                value={inputValue} // Usar inputValue aquí
                onChange={(e) => setInputValue(e.target.value)} // Actualizar inputValue
                className="pl-10 h-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-muted-foreground mb-1">
              Categoría
            </label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as ResourceCategory | typeof ALL_CATEGORIES_VALUE)}
            >
              <SelectTrigger id="category-filter" className="h-10">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_VALUE}>Todas las Categorías</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category.replace(/-/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones de acción en la última columna */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <Button
              variant={showOnlyFavorites ? "default" : "outline"}
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className="w-full h-10 flex-1" // flex-1 para que ocupen espacio disponible
            >
              {showOnlyFavorites ? <StarOff className="mr-2 h-4 w-4" /> : <StarIcon className="mr-2 h-4 w-4" />}
              {showOnlyFavorites ? "Todos" : "Favoritos"}
              <span className="ml-1.5 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                {showOnlyFavorites ? filteredResources.length : favorites.size}
              </span>
            </Button>
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="w-full h-10 flex-1 md:w-auto" // Ajuste para botón de limpiar
              title="Limpiar todos los filtros"
            >
              <XIcon className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          </div>
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isFavorite={favorites.has(resource.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No se encontraron recursos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Intenta ajustar tu búsqueda o filtros, o quita el filtro de "Solo Favoritos".
          </p>
        </div>
      )}
    </div>
  );
}
