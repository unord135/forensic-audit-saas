// Server Component — fetches directly from Supabase on the server.
// Re-renders automatically when the parent page does a router.refresh().
import { createClient } from "@/lib/supabase/server";
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
import { Badge } from "@/components/ui/badge";
import { History, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80)
    return (
      <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="h-4 w-4" /> {score}
      </span>
    );
  if (score >= 50)
    return (
      <span className="flex items-center gap-1.5 font-semibold text-yellow-600 dark:text-yellow-400">
        <ShieldAlert className="h-4 w-4" /> {score}
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
      <ShieldX className="h-4 w-4" /> {score}
    </span>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function AuditHistory() {
  const supabase = await createClient();

  const { data: runs, error } = await supabase
    .from("audit_runs")
    .select("id, score, secrets_count, vulnerabilities_count, scanned_files, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Table not yet created — silently hide the section
  if (error) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit History
        </CardTitle>
        <CardDescription>Your last {runs?.length ?? 0} security scans</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {!runs || runs.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            No audit runs yet — click <strong>Run Audit</strong> to create your first scan.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[160px]">Date</TableHead>
                <TableHead className="w-[110px]">Score</TableHead>
                <TableHead className="w-[100px] text-right">Secrets</TableHead>
                <TableHead className="w-[120px] text-right">Vulns</TableHead>
                <TableHead className="w-[120px] text-right">Files Scanned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(run.created_at)}
                  </TableCell>
                  <TableCell>
                    <ScoreBadge score={run.score} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`border-0 text-xs ${
                        run.secrets_count > 0
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {run.secrets_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`border-0 text-xs ${
                        run.vulnerabilities_count > 0
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {run.vulnerabilities_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                    {run.scanned_files}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
