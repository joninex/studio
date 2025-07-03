// src/lib/resource-utils.ts
import type { ResourceCategory } from "@/types";
import {
  Globe,
  GraduationCap,
  Palette,
  FileText,
  Tool,
  Pipette,
  Puzzle,
  Image as ImageIcon,
  Paintbrush,
  type LucideIcon // Importar el tipo LucideIcon
} from 'lucide-react';

export const DEFAULT_CATEGORY_ICONS: Record<ResourceCategory, LucideIcon> = {
  "hosting-ci-cd": Globe,
  "technical-training": GraduationCap,
  "ui-components-design": Palette,
  "documentation-pdf": FileText,
  "online-tools": Tool,
  "css-templates-generators": Pipette,
  "browser-extensions": Puzzle,
  "images-videos-illustrations": ImageIcon,
  "color-typography-inspiration": Paintbrush,
};

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  "hosting-ci-cd": "Hosting / CI-CD",
  "technical-training": "Capacitación Técnica",
  "ui-components-design": "Componentes UI / Diseño",
  "documentation-pdf": "Documentación / PDF",
  "online-tools": "Herramientas Online",
  "css-templates-generators": "Plantillas CSS / Generadores",
  "browser-extensions": "Extensiones de Navegador",
  "images-videos-illustrations": "Media (Imágenes, Videos, Ilust.)",
  "color-typography-inspiration": "Color, Tipografía & Inspiración"
};
