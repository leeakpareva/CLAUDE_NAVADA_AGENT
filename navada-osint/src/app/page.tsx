"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Brain, Loader2 } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { WorldMonitorEmbed } from "@/components/world-monitor-embed";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightsData {
  briefing: string;
  generated_at: string;
  alert_count: number;
}

function BriefingPanel() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/insights");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    const id = setInterval(() => fetchInsights(), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchInsights]);

  if (loading) {
    return (
      <Card className="border-amber-500/20 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-amber-400" />
            <CardTitle className="text-sm text-amber-400">
              AI Intelligence Briefing
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <p className="pt-2 text-xs text-muted-foreground">
            Generating intelligence briefing...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-amber-400" />
            <CardTitle className="text-sm text-amber-400">
              AI Intelligence Briefing
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {data?.generated_at && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(data.generated_at).toLocaleTimeString()} UTC
                {data.alert_count > 0 && ` | ${data.alert_count} signals`}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => fetchInsights(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`size-3 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {data?.briefing || "No intelligence briefing available."}
        </p>
      </CardContent>
    </Card>
  );
}

export default function SituationRoom() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 pt-12">
        <Sidebar />
        <main className="flex flex-1 flex-col gap-2 p-2 overflow-hidden">
          <div className="flex-[65] min-h-0">
            <WorldMonitorEmbed />
          </div>
          <div className="flex-[35] min-h-0 overflow-auto">
            <BriefingPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
