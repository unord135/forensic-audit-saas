import Link from "next/link";
import { GitHubSignInButton } from "@/components/GitHubSignInButton";
import { ShieldCheck, ScanLine, History, Lock, GitBranch } from "lucide-react";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Secret Detection",
    body: "Scans every source file for leaked AWS keys, Stripe secrets, database URLs, and 6 more patterns.",
  },
  {
    icon: Lock,
    title: "Dependency Audit",
    body: "Runs npm audit on every scan and maps CVEs by severity — critical, high, moderate, low.",
  },
  {
    icon: History,
    title: "Scan History",
    body: "Every audit is persisted to your account. Track your security score over time.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Forensic Audit
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in with email
          </Link>
          <GitHubSignInButton className="h-9 text-sm" />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-3xl mx-auto w-full gap-8">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Powered by Supabase + Next.js
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Security auditing for<br />
            <span className="text-primary">developer-founders</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Scan your codebase for leaked secrets and vulnerable dependencies.
            One click, instant score, full history — all tied to your GitHub account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <GitHubSignInButton className="h-11 px-8 text-sm font-medium" />
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border px-8 text-sm font-medium hover:bg-muted transition-colors"
          >
            Sign in with email
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Free during development &middot; No credit card required
        </p>
      </main>

      {/* Features */}
      <section className="border-t py-20 px-6">
        <div className="max-w-4xl mx-auto grid gap-8 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-6 text-center text-xs text-muted-foreground">
        Forensic Audit &middot; Built with Next.js, Supabase, shadcn/ui
      </footer>
    </div>
  );
}
