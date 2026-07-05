"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/components/PreferencesProvider";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { landingPage } = usePreferences();

  useEffect(() => {
    // Basic fallback if landingPage is somehow missing, but PreferencesProvider guarantees a default
    router.replace(landingPage || "/dashboard");
  }, [router, landingPage]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}
