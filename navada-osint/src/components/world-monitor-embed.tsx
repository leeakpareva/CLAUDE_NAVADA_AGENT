"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function WorldMonitorEmbed() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative size-full">
      {loading && (
        <Skeleton className="absolute inset-0 rounded-lg" />
      )}
      <iframe
        src="/worldmonitor/index.html"
        title="World Monitor"
        className="size-full border-0 rounded-lg"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
