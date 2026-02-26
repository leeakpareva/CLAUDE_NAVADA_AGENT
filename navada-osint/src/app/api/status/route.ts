import { NextResponse } from "next/server";
import { MONITORED_SERVICES, type ServiceStatus } from "@/lib/types";

export async function GET() {
  const results = await Promise.allSettled(
    MONITORED_SERVICES.map(async (service): Promise<ServiceStatus> => {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      try {
        const res = await fetch(service.url, { signal: controller.signal });
        clearTimeout(timeout);
        return {
          name: service.name,
          url: service.url,
          status: res.ok ? "online" : "offline",
          latencyMs: Date.now() - start,
        };
      } catch {
        clearTimeout(timeout);
        return {
          name: service.name,
          url: service.url,
          status: "offline",
          latencyMs: null,
        };
      }
    })
  );

  const statuses: ServiceStatus[] = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { name: "unknown", url: "", status: "unknown" as const, latencyMs: null }
  );

  return NextResponse.json(statuses);
}
