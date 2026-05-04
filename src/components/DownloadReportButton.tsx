"use client";

import { useState } from "react";
import { generateAuditPDF, type AuditReportData } from "@/lib/engine/reports";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export function DownloadReportButton({
  data,
}: {
  data: AuditReportData;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      // Dynamic import keeps jsPDF out of the initial page bundle
      const { generateAuditPDF: gen } = await import("@/lib/engine/reports");
      gen(data);
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
