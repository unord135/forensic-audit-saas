"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

export function PaymentBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<"success" | "cancelled" | null>(null);

  useEffect(() => {
    if (params.get("paid")) {
      setType("success");
      setVisible(true);
    } else if (params.get("cancelled")) {
      setType("cancelled");
      setVisible(true);
    }
  }, [params]);

  function dismiss() {
    setVisible(false);
    // Clean up the query params without triggering a full navigation
    const url = new URL(window.location.href);
    url.searchParams.delete("paid");
    url.searchParams.delete("cancelled");
    router.replace(url.pathname, { scroll: false });
  }

  if (!visible || !type) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
      )}
      <p className="flex-1">
        {isSuccess
          ? "Payment successful! Your Pro features are now active. Welcome to the team."
          : "Payment cancelled — you haven't been charged. Upgrade anytime from the button above."}
      </p>
      <button onClick={dismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
