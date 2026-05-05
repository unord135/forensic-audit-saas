import Link from "next/link";
import { GitHubSignInButton } from "@/components/GitHubSignInButton";
import {
  ShieldCheck, ScanLine, FileText,
  CheckCircle2, AlertTriangle, Share2,
} from "lucide-react";

const FREE_FEATURES = [
  "Full secrets scan — AWS keys, Stripe, DB URLs, more",
  "Real-time security score — 0 to 100",
  "Live vulnerability dashboard",
  "Unlimited scans on all your repos",
  "GitHub OAuth — zero config",
];

const PAID_FEATURES = [
  "Everything in Free",
  "Professional PDF Security Certification",
  "Shareable link — send directly to investors",
  "Full remediation steps per finding",
  "Colour-coded severity breakdown",
  "Certified Secure seal on your report",
  "Download any scan from your history",
];

const TERMINAL_LINES = [
  { type: "cmd",   text: "$ forensic-audit scan --repo my-startup" },
  { type: "info",  text: "  Scanning 34 source files…" },
  { type: "ok",    text: "  ✓  No secrets detected" },
  { type: "warn",  text: "  ⚠  2 vulnerable dependencies found" },
  { type: "warn",  text: "     lodash@4.17.20  · moderate · Prototype Pollution" },
  { type: "warn",  text: "     axios@0.21.1    · moderate · SSRF vulnerability" },
  { type: "info",  text: "" },
  { type: "score", text: "  Security Score: 90 / 100  [CERTIFIED SECURE]" },
  { type: "ok",    text: "  PDF ready — share with investors ↗" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Forensic Audit
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign in
            </Link>
            <GitHubSignInButton className="h-9 text-sm" />
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0f172a] text-white py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                Prove Your Startup<br />
                Is Secure.<br />
                <span className="text-indigo-400">Before Investors Ask.</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                Scan your codebase for leaked secrets and vulnerable dependencies.
                Get a PDF certification your investors can read in 30 seconds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <GitHubSignInButton className="h-12 px-8 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 border-0 text-white" />
              <a
                href="#pricing"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-8 text-sm font-medium text-white hover:bg-white/5 transition-colors"
              >
                See pricing →
              </a>
            </div>

            <p className="text-xs text-slate-500">
              Free scan — no credit card required &nbsp;·&nbsp; PDF certification ₹999 one-time
            </p>
          </div>

          {/* Right: terminal mockup */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl shadow-indigo-950/50">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-xs text-slate-400 font-mono">forensic-audit</span>
            </div>
            <div className="p-5 font-mono text-sm space-y-1.5 min-h-[220px]">
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className={
                  line.type === "cmd"   ? "text-slate-200" :
                  line.type === "ok"    ? "text-emerald-400" :
                  line.type === "warn"  ? "text-yellow-400" :
                  line.type === "score" ? "text-indigo-300 font-semibold" :
                  "text-slate-500"
                }>
                  {line.text || " "}
                </div>
              ))}
              <div className="text-slate-200 flex items-center gap-1 pt-1">
                <span className="animate-pulse">▋</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 border-b">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">From zero to certified in 3 steps</h2>
            <p className="text-muted-foreground">No config files. No CLI setup. Sign in and scan.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { n: "01", icon: ShieldCheck, title: "Connect GitHub",       body: "Sign in with GitHub OAuth. Your repos are fetched automatically — no tokens to paste, no setup." },
              { n: "02", icon: ScanLine,    title: "Run the Scan",         body: "Pick a repo. One click scans every file for secrets and checks all dependencies for known CVEs. Done in under 60 seconds." },
              { n: "03", icon: Share2,      title: "Share the Certificate", body: "Download a PDF or share a live link. Send it to your investor, your client, or your co-founder. One click." },
            ].map(({ n, icon: Icon, title, body }) => (
              <div key={n} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-primary/20 tabular-nums">{n}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Simple pricing</h2>
            <p className="text-muted-foreground">Scan for free. Pay once when you need the PDF.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">

            {/* Free */}
            <div className="rounded-2xl border bg-background p-8 flex flex-col gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Free</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">₹0</span>
                  <span className="text-muted-foreground">forever</span>
                </div>
                <p className="text-sm text-muted-foreground">Scan as much as you want, no card needed.</p>
              </div>
              <ul className="space-y-3 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <GitHubSignInButton className="w-full" />
            </div>

            {/* Paid */}
            <div className="rounded-2xl border-2 border-primary bg-background p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                ONE-TIME
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">PDF Certification</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">₹999</span>
                  <span className="text-muted-foreground">one-time</span>
                </div>
                <p className="text-sm text-muted-foreground">Pay once. Download PDFs for all your scans, forever.</p>
              </div>
              <ul className="space-y-3 flex-1">
                {PAID_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/api/checkout" className="w-full">
                <button className="w-full h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Get PDF Access — ₹999
                </button>
              </a>
            </div>
          </div>

          {/* Risk callout */}
          <div className="mt-10 rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex gap-4 items-start">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">The real cost of a secret leak</p>
              <p className="text-sm text-muted-foreground">
                The average cost of a data breach for a startup is <strong>$4.2M</strong>.
                A leaked AWS key can rack up <strong>$50,000+ in compute bills</strong> overnight.
                A ₹999 PDF is the cheapest insurance you will ever buy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#0f172a] text-white text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <ShieldCheck className="h-10 w-10 text-indigo-400 mx-auto" />
          <h2 className="text-3xl font-bold">Your investors will ask about security. Be ready.</h2>
          <p className="text-slate-400">Run your first free audit in under 60 seconds. No setup. No config.</p>
          <GitHubSignInButton className="h-12 px-10 mx-auto bg-indigo-600 hover:bg-indigo-500 border-0 text-white font-semibold" />
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4" /> Forensic Audit
          </div>
          <p>Built with Next.js · Supabase · Stripe · shadcn/ui</p>
        </div>
      </footer>

    </div>
  );
}
