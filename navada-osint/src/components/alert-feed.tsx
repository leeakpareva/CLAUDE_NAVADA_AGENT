"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_COLORS: Record<string, string> = {
  geopolitical: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  cyber: "bg-purple-600/20 text-purple-400 border-purple-500/30",
  military: "bg-red-600/20 text-red-400 border-red-500/30",
  economic: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
};

function AlertSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function AlertFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/alerts");
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
    const id = setInterval(fetchAlerts, 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Live Feed
        </p>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      </div>

      {loading ? (
        <AlertSkeleton />
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 pb-2">
            {alerts.map((alert) => {
              const categoryStyle =
                CATEGORY_COLORS[alert.category] ??
                "bg-zinc-600/20 text-zinc-400 border-zinc-500/30";

              return (
                <a
                  key={alert.id}
                  href={alert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md p-2 transition-colors hover:bg-accent/50"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 capitalize",
                        categoryStyle
                      )}
                    >
                      {alert.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {alert.source}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-snug line-clamp-2">
                    {alert.title}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.published_at), {
                      addSuffix: true,
                    })}
                  </p>
                </a>
              );
            })}
            {alerts.length === 0 && (
              <p className="px-2 py-8 text-center text-xs text-muted-foreground">
                No alerts available
              </p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
