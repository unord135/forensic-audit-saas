"use client";

import { useState, useTransition } from "react";
import { makeReportPublic } from "@/app/actions/audit";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Loader2 } from "lucide-react";

export function ShareReportButton({ runId }: { runId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleShare() {
    startTransition(async () => {
      try {
        const shareUrl = await makeReportPublic(runId);
        setUrl(shareUrl);
      } catch {
        // silently fail — user will see nothing change
      }
    });
  }

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (url) {
    return (
      <button
        onClick={handleCopy}
        title={url}
        className="inline-flex items-center gap-1.5 h-7 px-2 text-xs rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
      >
        {copied ? (
          <><Check className="h-3.5 w-3.5" /> Copied!</>
        ) : (
          <><Copy className="h-3.5 w-3.5" /> Copy link</>
        )}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      disabled={isPending}
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      Share
    </Button>
  );
}
