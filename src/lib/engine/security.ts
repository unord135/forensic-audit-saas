// Pure functions — no I/O, no React. Think of this as a Python module
// you'd unit-test with pytest. All side-effects live in the Server Action.

// --- Types (like Python TypedDicts / dataclasses) ---

export interface SecretMatch {
  type: string;
  file: string;
  line: number;
  preview: string; // redacted — safe to display
}

export interface VulnerableDep {
  name: string;
  severity: "low" | "moderate" | "high" | "critical";
  description: string;
  fixAvailable: boolean;
}

export interface AuditResult {
  secrets: SecretMatch[];
  vulnerabilities: VulnerableDep[];
  score: number;
  scannedFiles: number;
  timestamp: string;
}

// --- Secret scanning patterns ---

interface SecretPattern {
  type: string;
  // Regex with a capture group around the sensitive part to redact
  regex: RegExp;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    type: "AWS Access Key ID",
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
  },
  {
    type: "AWS Secret Access Key",
    // 40-char base64 string that follows common assignment patterns
    regex: /(?:aws[_-]?secret[_-]?(?:access[_-]?)?key\s*[=:]\s*["']?)([A-Za-z0-9/+=]{40})["']?/gi,
  },
  {
    type: "Stripe Secret Key",
    regex: /\b(sk_(?:live|test)_[0-9a-zA-Z]{24,})\b/g,
  },
  {
    type: "Stripe Publishable Key",
    regex: /\b(pk_(?:live|test)_[0-9a-zA-Z]{24,})\b/g,
  },
  {
    type: "Stripe Webhook Secret",
    regex: /\b(whsec_[0-9a-zA-Z]{32,})\b/g,
  },
  {
    type: "Database URL",
    regex: /((?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:]+:[^@\s"']+@[^\s"']+)/gi,
  },
  {
    type: "Generic API Key",
    regex: /(?:api[_-]?key|x-api-key)\s*[=:]\s*["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
  },
  {
    type: "Private Key (PEM)",
    regex: /(-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/g,
  },
  {
    type: "GitHub Personal Access Token",
    regex: /\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b/g,
  },
  {
    type: "Supabase Service Role Key",
    // Supabase service_role JWTs contain "service_role" in the payload
    regex: /\b(eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.(?:[A-Za-z0-9_-]+))\b/g,
  },
];

function redact(value: string): string {
  if (value.length <= 8) return "***";
  return value.slice(0, 4) + "***" + value.slice(-4);
}

// scanForSecrets — like: def scan_for_secrets(content: str, filename: str) -> list[SecretMatch]
export function scanForSecrets(content: string, filename: string): SecretMatch[] {
  const lines = content.split("\n");
  const matches: SecretMatch[] = [];
  const seen = new Set<string>(); // deduplicate same pattern on same line

  for (const pattern of SECRET_PATTERNS) {
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      // Reset lastIndex so global regex rescans from start each line
      pattern.regex.lastIndex = 0;
      let m: RegExpExecArray | null;

      while ((m = pattern.regex.exec(line)) !== null) {
        const raw = m[1] ?? m[0];
        const key = `${pattern.type}:${lineIdx}:${raw.slice(0, 8)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        matches.push({
          type: pattern.type,
          file: filename,
          line: lineIdx + 1,
          preview: redact(raw),
        });
      }
    }
  }

  return matches;
}

// --- Dependency auditing ---

// Parses the JSON output of `npm audit --json`.
// auditDependencies — like: def audit_dependencies(npm_audit_json: dict) -> list[VulnerableDep]
export function auditDependencies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  npmAuditJson: Record<string, any>
): VulnerableDep[] {
  const vulns: VulnerableDep[] = [];

  // npm audit v2 format: { vulnerabilities: { [name]: { severity, via, fixAvailable } } }
  const raw = npmAuditJson?.vulnerabilities ?? {};

  for (const [name, info] of Object.entries(raw)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = info as Record<string, any>;
    const severity = v.severity as VulnerableDep["severity"];
    if (!severity) continue;

    // `via` can be a string[] or an array of advisory objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viaList: any[] = Array.isArray(v.via) ? v.via : [];
    const description =
      viaList
        .filter((x) => typeof x === "object" && x?.title)
        .map((x) => x.title as string)
        .join("; ") || `Vulnerable package detected`;

    vulns.push({
      name,
      severity,
      description,
      fixAvailable: Boolean(v.fixAvailable),
    });
  }

  // Sort: critical → high → moderate → low
  const ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };
  vulns.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  return vulns;
}

// --- Score calculator ---

// computeScore — like: def compute_score(secrets, vulns) -> int
export function computeScore(
  secrets: SecretMatch[],
  vulns: VulnerableDep[]
): number {
  let score = 100;

  // Unique secret types found (finding the same type twice doesn't double-penalise)
  const uniqueSecretTypes = new Set(secrets.map((s) => s.type));
  score -= uniqueSecretTypes.size * 20;

  for (const v of vulns) {
    if (v.severity === "critical") score -= 15;
    else if (v.severity === "high") score -= 10;
    else if (v.severity === "moderate") score -= 5;
    else score -= 2;
  }

  return Math.max(0, Math.min(100, score));
}
