"use client";

// Client Component — OAuth triggers a browser redirect, so it must run client-side.
// Like calling `window.location.href = github_oauth_url` in plain JS.
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";

export function GitHubSignInButton({ className }: { className?: string }) {
  const supabase = createClient();

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "read:user",
      },
    });
  }

  return (
    <Button onClick={handleSignIn} variant="outline" className={`gap-2 ${className ?? ""}`}>
      <GitBranch className="h-4 w-4" />
      Continue with GitHub
    </Button>
  );
}
