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
        src="http://192.168.0.36:4001"
        title="World Monitor"
        className="size-full border-0 rounded-lg"
        allow="fullscreen; geolocation"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
