"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface EmbedFrameProps {
  url: string;
  title: string;
}

export function EmbedFrame({ url, title }: EmbedFrameProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative size-full">
      {loading && !error && (
        <Skeleton className="absolute inset-0 rounded-lg" />
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-card text-muted-foreground">
          <AlertCircle className="size-8" />
          <p className="text-sm">Failed to load {title}</p>
          <p className="text-xs">{url}</p>
        </div>
      )}
      <iframe
        src={url}
        title={title}
        className="size-full border-0 rounded-lg"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
