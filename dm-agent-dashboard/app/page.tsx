"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/DashboardContext";

export default function HomePage() {
  const router = useRouter();
  const { dashboards } = useDashboard();

  useEffect(() => {
    // Redirect to first dashboard or insights if no dashboards exist
    if (dashboards.length > 0) {
      router.push(`/dashboard/${dashboards[0].id}`);
    } else {
      router.push("/insights");
    }
  }, [dashboards, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#22C558] border-r-transparent mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
