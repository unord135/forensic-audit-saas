"use server";

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
import { createClient } from "@/lib/supabase/server";

const execAsync = promisify(exec);

const SCAN_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".env", ".env.local", ".env.production", ".env.development",
  ".json", ".yaml", ".yml", ".toml",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", ".turbo",
]);

async function collectFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: import("fs").Dirent[];

  try {
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

  const files = await collectFiles(projectRoot);
  const allSecrets: SecretMatch[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const rel = path.relative(projectRoot, file).replace(/\\/g, "/");
      allSecrets.push(...scanForSecrets(content, rel));
    } catch {
      // skip unreadable files
    }
  }

  let vulns: VulnerableDep[] = [];
  try {
    const { stdout } = await execAsync("npm audit --json", {
      cwd: projectRoot,
      timeout: 30_000,
    });
    vulns = auditDependencies(JSON.parse(stdout));
  } catch (err: unknown) {
    const npmErr = err as { stdout?: string };
    if (npmErr?.stdout) {
      try {
        vulns = auditDependencies(JSON.parse(npmErr.stdout));
      } catch {
        // malformed JSON
      }
    }
  }

  return {
    secrets: allSecrets,
    vulnerabilities: vulns,
    score: computeScore(allSecrets, vulns),
    scannedFiles: files.length,
    timestamp: new Date().toISOString(),
    findings: { secrets: allSecrets, vulnerabilities: vulns },
  };
}

// Persists a completed audit result to the audit_runs table.
// Silently skips if the user is not authenticated (e.g. during dev without login).
export async function saveAuditRun(result: AuditResult): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_runs").insert({
    user_id: user.id,
    score: result.score,
    scanned_files: result.scannedFiles,
    secrets_count: result.secrets.length,
    vulnerabilities_count: result.vulnerabilities.length,
    findings: result.findings,
  });
}
