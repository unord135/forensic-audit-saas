// GitHub-based audit engine.
// Fetches file contents from a repo via GitHub API, scans for secrets,
// and checks package.json dependencies against the OSV vulnerability database.
// Think of this as: async def scan_github_repo(owner, repo, token) -> AuditResult

import { scanForSecrets, computeScore, type AuditResult, type VulnerableDep } from "./security";

const SCAN_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".env", ".json", ".yaml", ".yml", ".toml", ".sh",
]);

const SKIP_PATH_SEGMENTS = new Set([
  "node_modules", ".next", "dist", "build", ".turbo", "coverage",
]);

// GitHub caps base64-encoded content at 1 MB per file via the Contents API.
const MAX_FILE_BYTES = 500_000;
const MAX_FILES_TO_SCAN = 100;

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Returns the default branch + sha for the repo.
async function getDefaultBranch(owner: string, repo: string, token: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: githubHeaders(token),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} on repo metadata`);
  const data = await res.json() as { default_branch: string };
  return data.default_branch ?? "main";
}

interface TreeItem {
  path: string;
  type: string;
  size?: number;
}

// Gets the full recursive file tree for a repo.
async function getFileTree(
  owner: string, repo: string, branch: string, token: string
): Promise<TreeItem[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: githubHeaders(token), next: { revalidate: 0 } }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status} on file tree`);
  const data = await res.json() as { tree: TreeItem[]; truncated?: boolean };
  return data.tree ?? [];
}

// Fetches a single file's content from GitHub and decodes it from base64.
async function fetchFileContent(
  owner: string, repo: string, filePath: string, token: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      { headers: githubHeaders(token), next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { content?: string; encoding?: string; size?: number };
    if (data.encoding !== "base64" || !data.content) return null;
    if ((data.size ?? 0) > MAX_FILE_BYTES) return null;
    // GitHub includes newlines inside the base64 string — strip them before decoding.
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
  } catch {
    return null;
  }
}

// ── OSV vulnerability check ───────────────────────────────────────────────────
// OSV.dev (Open Source Vulnerability database) — free, no API key needed.
// Like calling `requests.post("https://api.osv.dev/v1/querybatch", json={...})`

interface OsvVuln {
  id: string;
  summary?: string;
  severity?: { type: string; score: string }[];
  database_specific?: { severity?: string };
}

interface OsvResult {
  vulns?: OsvVuln[];
}

function stripVersionRange(version: string): string {
  // Converts "^4.17.0" → "4.17.0", "~2.1.x" → "2.1.x", etc.
  return version.replace(/^[\^~>=<v\s]+/, "").split(" ")[0] ?? version;
}

function mapOsvSeverity(
  dbSeverity?: string,
  cvssScore?: string
): VulnerableDep["severity"] {
  const s = (dbSeverity ?? "").toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "moderate" || s === "medium") return "moderate";
  if (s === "low") return "low";
  // Fallback: parse CVSS score
  const score = parseFloat(cvssScore ?? "0");
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "moderate";
  return "low";
}

async function checkOsvVulnerabilities(
  deps: Record<string, string>
): Promise<VulnerableDep[]> {
  const entries = Object.entries(deps).filter(
    ([, v]) => v && !v.startsWith("file:") && !v.startsWith("workspace:")
  );
  if (entries.length === 0) return [];

  const queries = entries.map(([name, version]) => ({
    package: { name, ecosystem: "npm" },
    version: stripVersionRange(version),
  }));

  try {
    const res = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];

    const data = await res.json() as { results: OsvResult[] };
    const vulns: VulnerableDep[] = [];

    data.results?.forEach((result, i) => {
      if (!result.vulns || result.vulns.length === 0) return;
      // Use the first (usually most severe) vuln for this package.
      const vuln = result.vulns[0];
      const cvssEntry = vuln.severity?.find((s) => s.type.startsWith("CVSS"));
      vulns.push({
        name: entries[i][0],
        severity: mapOsvSeverity(
          vuln.database_specific?.severity,
          cvssEntry?.score
        ),
        description: vuln.summary ?? "Known vulnerability detected",
        fixAvailable: true,
      });
    });

    // Sort critical → high → moderate → low
    const ORDER: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
    vulns.sort((a, b) => (ORDER[a.severity] ?? 4) - (ORDER[b.severity] ?? 4));
    return vulns;
  } catch {
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

// Scans a GitHub repo for secrets and vulnerable dependencies.
// repoFullName = "owner/repo" (e.g. "torvalds/linux")
export async function scanGitHubRepo(
  repoFullName: string,
  token: string
): Promise<AuditResult> {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) throw new Error(`Invalid repo name: ${repoFullName}`);

  // 1. Get the file tree.
  const defaultBranch = await getDefaultBranch(owner, repo, token);
  const tree = await getFileTree(owner, repo, defaultBranch, token);

  // 2. Filter to scannable files.
  const scannable = tree
    .filter((item) => {
      if (item.type !== "blob") return false;
      if ((item.size ?? 0) > MAX_FILE_BYTES) return false;
      const parts = item.path.split("/");
      if (parts.some((p) => SKIP_PATH_SEGMENTS.has(p))) return false;
      const ext = item.path.includes(".")
        ? "." + item.path.split(".").pop()!.toLowerCase()
        : "";
      // Always include .env files regardless of extension match
      const isEnvFile = parts.at(-1)?.startsWith(".env") ?? false;
      return SCAN_EXTENSIONS.has(ext) || isEnvFile;
    })
    .slice(0, MAX_FILES_TO_SCAN);

  // 3. Fetch and scan file contents in parallel (batches of 10 to respect rate limits).
  const secrets = [];
  for (let i = 0; i < scannable.length; i += 10) {
    const batch = scannable.slice(i, i + 10);
    const contents = await Promise.all(
      batch.map((f) => fetchFileContent(owner, repo, f.path, token))
    );
    for (let j = 0; j < batch.length; j++) {
      const content = contents[j];
      if (content) {
        secrets.push(...scanForSecrets(content, batch[j].path));
      }
    }
  }

  // 4. Check package.json dependencies against OSV.
  let vulns: VulnerableDep[] = [];
  const pkgContent = await fetchFileContent(owner, repo, "package.json", token);
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      vulns = await checkOsvVulnerabilities(allDeps);
    } catch {
      // Malformed package.json — skip vuln check.
    }
  }

  return {
    secrets,
    vulnerabilities: vulns,
    score: computeScore(secrets, vulns),
    scannedFiles: scannable.length,
    timestamp: new Date().toISOString(),
    findings: { secrets, vulnerabilities: vulns },
  };
}
