import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

// Force Node runtime (not Edge) to ensure Buffer, crypto, etc. are available
export const runtime = "nodejs";

// Env helpers
function getEnv(name: string, required = true) {
  const v = process.env[name];
  if (!v && required) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v || "";
}

// Normalize PEM format regardless of whether it is stored with "\n" or real newlines
function normalizePrivateKey(pem: string) {
  return pem.replace(/\\n/g, "\n");
}

// Sanitize a single filename (no directory separators)
function sanitizeFilename(name: string) {
  // Remove any path separators and allow common safe chars
  const base = name.split("/").pop()!.split("\\").pop()!;
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Upload files directly to the root of the repository
function buildRepoPath(filename: string) {
  return sanitizeFilename(filename);
}

// Get an Octokit instance authenticated as the GitHub App (app-level)
async function getAppOctokit() {
  const appId = getEnv("GITHUB_APP_ID");
  const privateKey = normalizePrivateKey(getEnv("GITHUB_APP_PRIVATE_KEY"));

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });

  return { appOctokit, appId, privateKey };
}

// Get an Octokit instance authenticated as the Installation for the target repo
async function getInstallationOctokit(owner: string) {
  const { appOctokit } = await getAppOctokit();

  // Find the installation for the target repo
  const installations = await appOctokit.apps.listInstallations();
  let installationId: number | null = null;

  for (const installation of installations.data) {
    if (installation.account?.login === owner) {
      installationId = installation.id;
      break;
    }
  }

  if (!installationId) {
    throw new Error(`No GitHub App installation found for owner: ${owner}`);
  }

  // Create installation-specific Octokit
  const installationOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: getEnv("GITHUB_APP_ID"),
      privateKey: normalizePrivateKey(getEnv("GITHUB_APP_PRIVATE_KEY")),
      installationId,
    },
  });

  return installationOctokit;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Hard-coded repository for image templates
    const owner = "juanjaragavi";
    const repo = "topfinanzas-ac-image-email-templates";

    const { filename, content, commitMessage } = payload;

    if (!filename || !content) {
      return NextResponse.json(
        {
          error: "Se requiere nombre de archivo y contenido para la imagen",
        },
        { status: 400 }
      );
    }

    // Validate image file extension (PNG or JPG/JPEG)
    const lower = filename.toLowerCase();
    const isValidImage =
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg");
    if (!isValidImage) {
      return NextResponse.json(
        {
          error:
            "Solo se permiten capturas de pantalla en formato PNG, JPG o JPEG",
        },
        { status: 400 }
      );
    }

    // Enforce file size limit for GitHub Contents API (recommend <=1MB)
    const approxSizeBytes = Buffer.byteLength(content, "base64");
    if (approxSizeBytes > 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen es muy grande. Límite máximo: 1MB" },
        { status: 413 }
      );
    }

    const path = buildRepoPath(filename);
    const octokit = await getInstallationOctokit(owner);

    // Check if file exists on main branch
    let existingSha: string | undefined;
    try {
      const existing = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: "main",
      });
      // If file exists, capture its sha to update
      if (!Array.isArray(existing.data) && existing.data.type === "file") {
        existingSha = existing.data.sha;
      }
    } catch (e: unknown) {
      const err = e as { status?: number };
      if (err?.status !== 404) {
        throw e;
      }
    }

    // Create or update the file directly on main branch
    const fileOperation = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message:
        commitMessage ||
        `feat: agregar captura exitosa ${filename} - alto rendimiento en clicks y aperturas`,
      content: content, // Base64 encoded image content (PNG/JPG/JPEG)
      branch: "main",
      ...(existingSha && { sha: existingSha }),
    });

    const result = {
      ok: true,
      path: path,
      branch: "main",
      commitUrl: fileOperation.data.commit.html_url,
      fileUrl: fileOperation.data.content?.html_url,
    };

    console.log("✅ Captura de broadcast exitoso subida:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error al subir captura de broadcast:", error);

    let errorMessage = "Error durante la subida de la captura de pantalla";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        errorMessage = "Repositorio de capturas no encontrado";
      } else if (err.status === 403) {
        errorMessage = "Sin permisos para subir capturas al repositorio";
      } else if (err.message) {
        errorMessage = err.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        ok: false,
      },
      { status: 500 }
    );
  }
}
