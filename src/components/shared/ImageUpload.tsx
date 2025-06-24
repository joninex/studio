// src/components/shared/ImageUpload.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from './LoadingSpinner';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUploadComplete: (path: string) => void;
  currentImageUrl?: string | null;
  label: string;
  placeholderImage: string;
  aiHint: string;
  imageClassName?: string;
  uploadingText?: string;
  buttonText?: string;
}

export function ImageUpload({
  onUploadComplete,
  currentImageUrl,
  label,
  placeholderImage,
  aiHint,
  imageClassName,
  uploadingText = "Subiendo...",
  buttonText = "Cambiar Imagen",
}: ImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

  const fileInputId = `file-input-${label.replace(/\s+/g, '-')}`;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vista previa optimista
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadComplete(result.path);
        toast({ title: "Éxito", description: "Imagen subida correctamente." });
      } else {
        throw new Error(result.message || 'Error al subir la imagen.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error de Carga', description: error.message });
      setPreview(currentImageUrl || null); // Revertir vista previa en caso de error
    } finally {
      setIsUploading(false);
    }
  };
  
  useEffect(() => {
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);

  const triggerFileInput = () => {
    document.getElementById(fileInputId)?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        src={preview || placeholderImage}
        alt={label}
        width={120}
        height={120}
        className={cn("border-2 border-primary/20 bg-muted/20 shadow-md", imageClassName)}
        data-ai-hint={aiHint}
        key={preview} // Forzar re-renderizado al cambiar la URL
        unoptimized={preview?.startsWith('blob:')} // Evitar optimización para vistas previas locales
      />
      <Input
        id={fileInputId}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/gif, image/webp"
        disabled={isUploading}
      />
      <Button type="button" variant="outline" onClick={triggerFileInput} disabled={isUploading}>
        {isUploading ? <LoadingSpinner size={16} className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
        {isUploading ? uploadingText : buttonText}
      </Button>
    </div>
  );
}
