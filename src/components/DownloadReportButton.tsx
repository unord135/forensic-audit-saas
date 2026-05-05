"use client";

import { useState } from "react";
import type { AuditReportData } from "@/lib/engine/reports";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Lock } from "lucide-react";

export function DownloadReportButton({
  data,
  isPro,
}: {
  data: AuditReportData;
  isPro: boolean;
}) {
  const [loading, setLoading] = useState(false);

  // Free users: show a locked button that redirects to checkout.
  if (!isPro) {
    return (
      <a href="/api/checkout" title="Upgrade to Pro to download PDF reports">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-amber-600"
        >
          <Lock className="h-3.5 w-3.5" />
          PDF
        </Button>
      </a>
    );
  }

  async function handleDownload() {
    setLoading(true);
    try {
      const { generateAuditPDF } = await import("@/lib/engine/reports");
      generateAuditPDF(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      PDF
    </Button>
  );
}
