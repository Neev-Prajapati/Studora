"use client";

import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isPending } = useSession();

  if (isPending) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Authenticating...</p>
      </div>
    );
  }

  return <>{children}</>;
}
