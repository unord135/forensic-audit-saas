"use server";

// Server Action — runs only on the server, like a Flask POST route handler.
// The client calls this via form action or direct import; no API route needed.

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import {
  scanForSecrets,
  auditDependencies,
  computeScore,
  type AuditResult,
  type SecretMatch,
  type VulnerableDep,
} from "@/lib/engine/security";

const execAsync = promisify(exec);

const SCAN_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".env", ".env.local", ".env.production", ".env.development",
  ".json", ".yaml", ".yml", ".toml",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", ".turbo",
]);

// Recursively collect files to scan — like os.walk() in Python
async function collectFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  let entries: import("fs").Dirent[];
  try {
    // encoding: "utf-8" ensures entry.name is string, not Buffer
    entries = await fs.readdir(dir, { withFileTypes: true, encoding: "utf-8" });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name as string)) continue;
    const full = path.join(dir, entry.name as string);

    if (entry.isDirectory()) {
      results.push(...(await collectFiles(full)));
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name as string).toLowerCase())) {
      results.push(full);
    }
  }

  return results;
}

export async function runAudit(): Promise<AuditResult> {
  const projectRoot = process.cwd();

  // 1. Collect + scan files for secrets
  const files = await collectFiles(projectRoot);
  const allSecrets: SecretMatch[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const rel = path.relative(projectRoot, file).replace(/\\/g, "/");
      allSecrets.push(...scanForSecrets(content, rel));
    } catch {
      // skip unreadable files (binaries, permission errors)
    }
  }

  // 2. Run npm audit and parse vulnerability data
  let vulns: VulnerableDep[] = [];
  try {
    const { stdout } = await execAsync("npm audit --json", {
      cwd: projectRoot,
      timeout: 30_000,
    });
    vulns = auditDependencies(JSON.parse(stdout));
  } catch (err: unknown) {
    // npm audit exits with code 1 when vulns are found; stdout still has valid JSON
    const npmErr = err as { stdout?: string };
    if (npmErr?.stdout) {
      try {
        vulns = auditDependencies(JSON.parse(npmErr.stdout));
      } catch {
        // malformed JSON — proceed with empty vulns
      }
    }
  }

  return {
    secrets: allSecrets,
    vulnerabilities: vulns,
    score: computeScore(allSecrets, vulns),
    scannedFiles: files.length,
    timestamp: new Date().toISOString(),
  };
}
