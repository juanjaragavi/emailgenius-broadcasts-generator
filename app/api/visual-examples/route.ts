import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Force Node runtime for file system access
export const runtime = "nodejs";

/**
 * API Route for managing local visual examples
 * Replaces external GitHub repository uploads with local file management
 */

// Sanitize filename for safe storage
function sanitizeFilename(name: string): string {
  const base = name.split("/").pop()!.split("\\").pop()!;
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Validate image file extension
function isValidImageExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [".png", ".webp", ".jpg", ".jpeg"].includes(ext);
}

/**
 * POST - Upload a new visual example to public/images
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { filename, content, description } = payload;

    if (!filename || !content) {
      return NextResponse.json(
        {
          error: "Se requiere nombre de archivo y contenido para la imagen",
        },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!isValidImageExtension(filename)) {
      return NextResponse.json(
        {
          error: "Solo se permiten imágenes en formato PNG, WebP, JPG o JPEG",
        },
        { status: 400 }
      );
    }

    // Enforce file size limit (1MB for base64)
    const approxSizeBytes = Buffer.byteLength(content, "base64");
    if (approxSizeBytes > 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen es muy grande. Límite máximo: 1MB" },
        { status: 413 }
      );
    }

    const sanitizedFilename = sanitizeFilename(filename);
    const imagesDir = path.join(process.cwd(), "public", "images");
    const filePath = path.join(imagesDir, sanitizedFilename);

    // Ensure images directory exists
    try {
      await fs.access(imagesDir);
    } catch {
      await fs.mkdir(imagesDir, { recursive: true });
    }

    // Check if file already exists
    let finalFilename = sanitizedFilename;
    try {
      await fs.access(filePath);
      // File exists, add timestamp to make unique
      const ext = path.extname(sanitizedFilename);
      const base = path.basename(sanitizedFilename, ext);
      finalFilename = `${base}_${Date.now()}${ext}`;
    } catch {
      // File doesn't exist, use original name
    }

    const finalPath = path.join(imagesDir, finalFilename);

    // Write the file
    const imageBuffer = Buffer.from(content, "base64");
    await fs.writeFile(finalPath, imageBuffer);

    // Create optional metadata file
    if (description) {
      const metadataPath = path.join(
        imagesDir,
        `${path.basename(finalFilename, path.extname(finalFilename))}.json`
      );
      await fs.writeFile(
        metadataPath,
        JSON.stringify(
          {
            filename: finalFilename,
            description,
            uploadedAt: new Date().toISOString(),
            type: "visual_example",
          },
          null,
          2
        )
      );
    }

    console.log(`✅ Visual example saved: ${finalFilename}`);

    return NextResponse.json({
      ok: true,
      filename: finalFilename,
      path: `/images/${finalFilename}`,
      message: "Ejemplo visual guardado localmente para entrenamiento de IA",
    });
  } catch (error) {
    console.error("Error saving visual example:", error);
    return NextResponse.json(
      { error: "Error al guardar el ejemplo visual" },
      { status: 500 }
    );
  }
}

/**
 * GET - List all visual examples in public/images
 */
export async function GET() {
  try {
    const imagesDir = path.join(process.cwd(), "public", "images");

    // Ensure directory exists
    try {
      await fs.access(imagesDir);
    } catch {
      return NextResponse.json({
        images: [],
        count: 0,
        message: "No hay ejemplos visuales disponibles",
      });
    }

    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter((f) => isValidImageExtension(f));

    const images = await Promise.all(
      imageFiles.map(async (filename) => {
        const filePath = path.join(imagesDir, filename);
        const stats = await fs.stat(filePath);

        // Try to load metadata if exists
        let metadata = null;
        const metadataPath = path.join(
          imagesDir,
          `${path.basename(filename, path.extname(filename))}.json`
        );
        try {
          const metadataContent = await fs.readFile(metadataPath, "utf-8");
          metadata = JSON.parse(metadataContent);
        } catch {
          // No metadata file
        }

        return {
          filename,
          path: `/images/${filename}`,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          description: metadata?.description || null,
        };
      })
    );

    // Sort by upload date, newest first
    images.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({
      images,
      count: images.length,
      message: `${images.length} ejemplos visuales disponibles para entrenamiento`,
    });
  } catch (error) {
    console.error("Error listing visual examples:", error);
    return NextResponse.json(
      { error: "Error al listar ejemplos visuales" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a visual example from public/images
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Se requiere el nombre del archivo a eliminar" },
        { status: 400 }
      );
    }

    const sanitizedFilename = sanitizeFilename(filename);
    const imagesDir = path.join(process.cwd(), "public", "images");
    const filePath = path.join(imagesDir, sanitizedFilename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "El archivo no existe" },
        { status: 404 }
      );
    }

    // Delete the file
    await fs.unlink(filePath);

    // Try to delete metadata file too
    const metadataPath = path.join(
      imagesDir,
      `${path.basename(sanitizedFilename, path.extname(sanitizedFilename))}.json`
    );
    try {
      await fs.unlink(metadataPath);
    } catch {
      // No metadata file to delete
    }

    console.log(`🗑️ Visual example deleted: ${sanitizedFilename}`);

    return NextResponse.json({
      ok: true,
      message: "Ejemplo visual eliminado correctamente",
    });
  } catch (error) {
    console.error("Error deleting visual example:", error);
    return NextResponse.json(
      { error: "Error al eliminar el ejemplo visual" },
      { status: 500 }
    );
  }
}
