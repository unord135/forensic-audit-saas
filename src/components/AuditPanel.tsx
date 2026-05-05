"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runRepoAudit, saveAuditRun } from "@/app/actions/audit";
import type { AuditResult } from "@/lib/engine/security";
import type { GitHubRepo } from "@/lib/engine/github";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ScanLine,
  Loader2,
  KeyRound,
  Package,
  ChevronDown,
} from "lucide-react";

function scoreConfig(score: number) {
  if (score >= 80)
    return { label: "Secure", color: "text-emerald-600 dark:text-emerald-400", Icon: ShieldCheck };
  if (score >= 50)
    return { label: "Needs Attention", color: "text-yellow-600 dark:text-yellow-400", Icon: ShieldAlert };
  return { label: "At Risk", color: "text-red-600 dark:text-red-400", Icon: ShieldX };
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high:     "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low:      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function AuditPanel({ repos }: { repos: GitHubRepo[] }) {
  const router = useRouter();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<string>(repos[0]?.full_name ?? "");

  function handleRunAudit() {
    if (!selectedRepo) return;
    setError(null);
    startTransition(async () => {
      try {
        const data = await runRepoAudit(selectedRepo);
        setResult(data);
        await saveAuditRun(data, selectedRepo);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Audit failed. Please try again.");
      }
    });
  }

  const cfg = result ? scoreConfig(result.score) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Security Audit
          </CardTitle>
          <CardDescription className="mt-1">
            Select a repository and scan it for leaked secrets and vulnerable
            dependencies.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Repo selector — like a Python select widget */}
          {repos.length > 0 ? (
            <div className="relative">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                disabled={isPending}
                className="h-9 appearance-none rounded-md border bg-background px-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.full_name}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No repos found</span>
          )}

          <Button
            onClick={handleRunAudit}
            disabled={isPending || !selectedRepo}
            className="shrink-0"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <ScanLine className="mr-2 h-4 w-4" />
                Run Audit
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {error && (
        <CardContent>
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        </CardContent>
      )}

      {result && cfg && (
        <CardContent className="space-y-8">
          {/* Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <cfg.Icon className={`h-5 w-5 ${cfg.color}`} />
                <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-muted-foreground">
                  — {selectedRepo}
                </span>
              </div>
              <span className="text-2xl font-bold tabular-nums">
                {result.score}
                <span className="text-sm font-normal text-muted-foreground">/100</span>
              </span>
            </div>
            <Progress value={result.score} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Scanned {result.scannedFiles} files &middot;{" "}
              {new Date(result.timestamp).toLocaleTimeString()}
            </p>
          </div>

          {/* Secrets */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <KeyRound className="h-4 w-4" />
              Exposed Secrets
              <Badge
                variant="outline"
                className={
                  result.secrets.length > 0
                    ? "border-0 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                }
              >
                {result.secrets.length}
              </Badge>
            </h3>
            {result.secrets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No secrets detected.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="w-[70px] text-right">Line</TableHead>
                    <TableHead className="w-[140px]">Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.secrets.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{s.type}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{s.file}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{s.line}</TableCell>
                      <TableCell className="font-mono text-xs">{s.preview}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Vulnerabilities */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Package className="h-4 w-4" />
              Dependency Vulnerabilities
              <Badge
                variant="outline"
                className={
                  result.vulnerabilities.length > 0
                    ? "border-0 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    : "border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                }
              >
                {result.vulnerabilities.length}
              </Badge>
            </h3>
            {result.vulnerabilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No known vulnerabilities found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Package</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px] text-right">Fix?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.vulnerabilities.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm font-medium">{v.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border-0 text-xs font-medium ${SEVERITY_STYLES[v.severity] ?? ""}`}
                        >
                          {v.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {v.description}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {v.fixAvailable
                          ? <span className="text-emerald-600">Yes</span>
                          : <span className="text-muted-foreground">No</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
