import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ShieldCheck, ShieldAlert, ShieldX, KeyRound, Package } from "lucide-react";
import Link from "next/link";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function scoreConfig(score: number) {
  if (score >= 80) return {
    label: "CERTIFIED SECURE",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
    ring: "ring-emerald-500",
    Icon: ShieldCheck,
  };
  if (score >= 50) return {
    label: "ACTION REQUIRED",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    ring: "ring-yellow-500",
    Icon: ShieldAlert,
  };
  return {
    label: "CRITICAL ISSUES",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    ring: "ring-red-500",
    Icon: ShieldX,
  };
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }).format(new Date(iso));
}

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: run, error } = await getSupabaseAdmin()
    .from("audit_runs")
    .select("id, repo_name, score, scanned_files, secrets_count, vulnerabilities_count, created_at, is_public")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !run) notFound();

  const cfg = scoreConfig(run.score);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4 py-16">

      {/* Certificate card */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header band */}
        <div className="bg-[#0f172a] px-8 py-6 text-white text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <ShieldCheck className="h-4 w-4" />
            Forensic Audit Platform
          </div>
          <h1 className="text-xl font-bold">Security Certification</h1>
          {run.repo_name && (
            <p className="text-slate-400 text-sm font-mono">{run.repo_name}</p>
          )}
        </div>

        {/* Score */}
        <div className="px-8 py-10 flex flex-col items-center gap-4">
          <div className={`ring-4 ${cfg.ring} rounded-full w-28 h-28 flex flex-col items-center justify-center`}>
            <span className="text-4xl font-extrabold tabular-nums">{run.score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
            <cfg.Icon className="h-4 w-4" />
            {cfg.label}
          </div>

          {/* Stats */}
          <div className="w-full grid grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border bg-muted/30 p-4 text-center space-y-1">
              <p className="text-2xl font-bold tabular-nums">{run.scanned_files}</p>
              <p className="text-xs text-muted-foreground">Files scanned</p>
            </div>
            <div className={`rounded-xl border p-4 text-center space-y-1 ${run.secrets_count > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/30" : ""}`}>
              <div className="flex items-center justify-center gap-1">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                <p className={`text-2xl font-bold tabular-nums ${run.secrets_count > 0 ? "text-red-600" : ""}`}>{run.secrets_count}</p>
              </div>
              <p className="text-xs text-muted-foreground">Secrets found</p>
            </div>
            <div className={`rounded-xl border p-4 text-center space-y-1 ${run.vulnerabilities_count > 0 ? "border-orange-200 bg-orange-50 dark:bg-orange-950/30" : ""}`}>
              <div className="flex items-center justify-center gap-1">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <p className={`text-2xl font-bold tabular-nums ${run.vulnerabilities_count > 0 ? "text-orange-600" : ""}`}>{run.vulnerabilities_count}</p>
              </div>
              <p className="text-xs text-muted-foreground">Vulnerabilities</p>
            </div>
          </div>

          {/* Date + report ID */}
          <div className="w-full pt-2 border-t text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Generated on {formatDate(run.created_at)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Report ID: {run.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t px-8 py-6 bg-muted/20 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Want a security certification for your startup?
          </p>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get your free scan →
          </Link>
          <p className="text-xs text-muted-foreground">PDF certification available for ₹999 one-time</p>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-600">
        Powered by Forensic Audit Platform
      </p>
    </div>
  );
}
