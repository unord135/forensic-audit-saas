// Server Component — this runs like a Python script on the server.
// No 'use client' directive = no JS shipped to the browser for this file.
import { fetchGitHubRepos, type GitHubRepo } from "@/lib/engine/github";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star, GitFork, Calendar, ExternalLink } from "lucide-react";
import { AuditPanel } from "@/components/AuditPanel";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

// Language → colour mapping for the badge — like a Python dict
const LANG_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  JavaScript: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Python: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Rust: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Go: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  default: "bg-muted text-muted-foreground",
};

function langColor(lang: string | null): string {
  if (!lang) return LANG_COLORS.default;
  return LANG_COLORS[lang] ?? LANG_COLORS.default;
}

// async function = an async def — awaited automatically by Next.js
export default async function DashboardPage() {
  const username = process.env.GITHUB_USERNAME ?? "vercel";

  let repos: GitHubRepo[] = [];
  let error: string | null = null;

  try {
    repos = await fetchGitHubRepos(username);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Founder&apos;s Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Public repositories for{" "}
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            @{username}
          </a>
        </p>
      </div>

      {/* Error state */}
      {error && (
        <Card className="mb-6 border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive text-sm">
              Failed to load repositories
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Repos</CardDescription>
            <CardTitle className="text-4xl">{repos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Stars</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <Star className="h-7 w-7 text-yellow-500" />
              {repos.reduce((acc, r) => acc + r.stargazers_count, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Forks</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <GitFork className="h-7 w-7 text-blue-500" />
              {repos.reduce((acc, r) => acc + r.forks_count, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Security Audit */}
      <div className="mb-6">
        <AuditPanel />
      </div>

      {/* Repo table */}
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>
            Sorted by last updated. Click a repo name to open it on GitHub.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[260px]">Repository</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]">Language</TableHead>
                <TableHead className="w-[90px] text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Star className="h-3.5 w-3.5" /> Stars
                  </span>
                </TableHead>
                <TableHead className="w-[90px] text-right">
                  <span className="flex items-center justify-end gap-1">
                    <GitFork className="h-3.5 w-3.5" /> Forks
                  </span>
                </TableHead>
                <TableHead className="w-[140px] text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Updated
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos.length === 0 && !error && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No repositories found.
                  </TableCell>
                </TableRow>
              )}
              {repos.map((repo) => (
                <TableRow key={repo.id} className="group">
                  <TableCell className="font-medium">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      {repo.name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                    {repo.description ?? (
                      <span className="italic opacity-50">No description</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {repo.language ? (
                      <Badge
                        variant="outline"
                        className={`text-xs font-normal border-0 ${langColor(repo.language)}`}
                      >
                        {repo.language}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {repo.stargazers_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {repo.forks_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {formatDate(repo.updated_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
