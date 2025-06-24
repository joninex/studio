// src/app/api/upload/route.ts
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No se encontró ningún archivo.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Asegurarse de que el directorio de subida existe
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e: any) {
    // Ignorar el error si el directorio ya existe
    if (e.code !== 'EEXIST') {
      console.error('Error al crear el directorio de subida', e);
      return NextResponse.json({ success: false, message: 'No se pudo crear el directorio de subida.' }, { status: 500 });
    }
  }

  // Crear un nombre de archivo único para evitar colisiones
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  const filePath = path.join(uploadDir, filename);
  const publicPath = `/uploads/${filename}`;

  try {
    await writeFile(filePath, buffer);
    console.log(`Archivo subido y guardado en: ${filePath}`);
    return NextResponse.json({ success: true, path: publicPath });
  } catch (error) {
    console.error('Error al escribir el archivo', error);
    return NextResponse.json({ success: false, message: 'Error al guardar el archivo.' }, { status: 500 });
  }
}
