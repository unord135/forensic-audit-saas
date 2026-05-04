"use client";

import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <Button variant="ghost" size="sm" type="submit" className="gap-2 text-muted-foreground hover:text-foreground">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </form>
  );
}
