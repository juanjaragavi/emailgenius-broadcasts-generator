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
async function getInstallationOctokit(owner: string, repo: string) {
  const { appOctokit, appId, privateKey } = await getAppOctokit();

  // Resolve installation ID for the specific repo
  const { data: installation } = await appOctokit.apps.getRepoInstallation({
    owner,
    repo,
  });

  const installationId = installation.id;

  const installationOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });

  return installationOctokit;
}

// Types for incoming request
interface UploadPayload {
  filename: string; // e.g. "winner-subject-2025-08-21.md"
  content: string; // UTF-8 text content (markdown, txt, json, etc.)
  branchBase?: string; // default "main"
  skipPr?: boolean; // if true, commit directly to base branch (not recommended)
  commitMessage?: string; // optional custom commit message
}

export async function POST(req: NextRequest) {
  try {
    const owner = getEnv("GITHUB_OWNER");
    const repo = getEnv("GITHUB_REPO");

    let payload: UploadPayload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { filename, content } = payload;
    const branchBase = payload.branchBase || "main";
    const skipPr = Boolean(payload.skipPr);
    const commitMessage =
      payload.commitMessage ||
      `chore(upload): add ${sanitizeFilename(filename)} via EmailGenius`;

    if (!filename || !content) {
      return NextResponse.json(
        { error: "filename and content are required" },
        { status: 400 }
      );
    }

    // Enforce small file/text policy for Contents API (recommend <=1MB)
    const approxSizeBytes = Buffer.byteLength(content, "utf8");
    if (approxSizeBytes > 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large for simple upload. Limit is ~1MB." },
        { status: 413 }
      );
    }

    // Optional: basic extension allow-list for this repo
    const allowedExt = [".md", ".markdown", ".txt", ".json"];
    const lower = filename.toLowerCase();
    const hasAllowedExt = allowedExt.some((e) => lower.endsWith(e));
    if (!hasAllowedExt) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedExt.join(", ")}` },
        { status: 400 }
      );
    }

    const path = buildRepoPath(filename);
    const octokit = await getInstallationOctokit(owner, repo);

    // 1) Resolve base ref SHA (e.g., main)
    const baseRef = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branchBase}`,
    });
    const baseSha = baseRef.data.object.sha;

    // 2) Compute branch name
    const ts = Date.now();
    let branchName: string = skipPr
      ? branchBase
      : `upload/${new Date().toISOString().slice(0, 10)}-${ts}`;

    // 3) Create branch from base if we are not committing directly to base
    if (!skipPr) {
      try {
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        });
      } catch (e: unknown) {
        const err = e as { status?: number };
        // If branch exists already (very unlikely with timestamp), append random suffix
        if (err?.status === 422) {
          branchName = `${branchName}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          await octokit.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
          });
        } else {
          throw e;
        }
      }
    }

    // 4) Prepare content and detect if file exists on the target branch
    const b64 = Buffer.from(content, "utf8").toString("base64");

    let existingSha: string | undefined;
    try {
      const existing = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branchName,
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

    // 5) Create or update the file
    const putRes = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage,
      content: b64,
      branch: branchName,
      sha: existingSha, // undefined means create
      committer: { name: "EmailGenius Bot", email: "bot@topfinanzas.com" },
      author: { name: "EmailGenius Bot", email: "bot@topfinanzas.com" },
    });

    const commitUrl = putRes.data.commit.html_url;
    let prUrl: string | undefined;

    // 6) Optionally open PR
    if (!skipPr && branchName !== branchBase) {
      const pr = await octokit.pulls.create({
        owner,
        repo,
        head: branchName,
        base: branchBase,
        title: `feat(subject): add ${sanitizeFilename(filename)}`,
        body: [
          `Automated upload from EmailGenius.`,
          ``,
          `- File: \`${path}\``,
          `- Commit: ${commitUrl}`,
          `- Size: ${approxSizeBytes} bytes`,
        ].join("\n"),
        maintainer_can_modify: true,
      });
      prUrl = pr.data.html_url;
    }

    return NextResponse.json(
      {
        ok: true,
        path,
        branch: branchName,
        commitUrl,
        prUrl,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Do not leak sensitive details
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Upload error:", message);
    return NextResponse.json(
      { error: "Upload failed. Check server logs for details." },
      { status: 500 }
    );
  }
}
