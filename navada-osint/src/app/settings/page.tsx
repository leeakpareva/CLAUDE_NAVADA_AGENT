"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/lib/types";
import { MONITORED_SERVICES, OSINT_FEEDS } from "@/lib/types";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const STATUS_DOT: Record<ServiceStatus["status"], string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  unknown: "bg-zinc-500",
};

export default function SettingsPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [feedStates, setFeedStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(OSINT_FEEDS.map((f) => [f.url, true]))
  );

  async function fetchAllStatus() {
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

  useEffect(() => {
    fetchAllStatus();
  }, []);

  async function testService(name: string) {
    setTesting(name);
    await fetchAllStatus();
    setTesting(null);
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-auto pt-12">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <div>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              System configuration and connectivity
            </p>
          </div>

          {/* Service Connectivity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Service Connectivity</CardTitle>
              <CardDescription>
                Monitor and test connections to all NAVADA services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MONITORED_SERVICES.map((svc) => {
                  const status = services.find((s) => s.name === svc.name);
                  const svcStatus = status?.status ?? "unknown";
                  return (
                    <div
                      key={svc.name}
                      className="flex items-center justify-between rounded-md border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "block size-2.5 rounded-full",
                            STATUS_DOT[svcStatus]
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium">{svc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {svc.url}
                            {status?.latencyMs !== null &&
                              status?.latencyMs !== undefined &&
                              ` · ${status.latencyMs}ms`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testService(svc.name)}
                        disabled={testing === svc.name}
                      >
                        <RefreshCw
                          className={cn(
                            "size-3.5",
                            testing === svc.name && "animate-spin"
                          )}
                        />
                        Test
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">API Keys</CardTitle>
              <CardDescription>
                Configure API keys for future integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["OpenAI", "Bright Data", "Hugging Face"].map((name) => (
                  <div key={name} className="space-y-1.5">
                    <Label className="text-xs">{name} API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      disabled
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  API key management coming in a future update. Keys are
                  currently managed via .env files.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RSS Feed Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">RSS Feed Management</CardTitle>
              <CardDescription>
                Enable or disable OSINT intelligence feeds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {OSINT_FEEDS.map((feed) => (
                  <div
                    key={feed.url}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{feed.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {feed.category} · {feed.url}
                      </p>
                    </div>
                    <Switch
                      checked={feedStates[feed.url]}
                      onCheckedChange={(checked) =>
                        setFeedStates((prev) => ({
                          ...prev,
                          [feed.url]: checked,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
