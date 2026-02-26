"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_COLORS: Record<ServiceStatus["status"], string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  unknown: "bg-zinc-500",
};

export function ServiceStatusDots() {
  const [services, setServices] = useState<ServiceStatus[]>([]);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch {
        // silent fail
      }
    }
    fetchStatus();
    const id = setInterval(fetchStatus, 30_000);
    return () => clearInterval(id);
  }, []);

  if (services.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {services.map((svc) => (
          <Tooltip key={svc.name}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "block size-2 rounded-full",
                  STATUS_COLORS[svc.status]
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">{svc.name}</p>
              <p className="text-[10px] opacity-70">
                {svc.status === "online" && svc.latencyMs !== null
                  ? `${svc.latencyMs}ms`
                  : svc.status}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
