"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Brain,
  BarChart3,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  geopolitical: {
    bg: "bg-blue-500",
    text: "text-blue-400",
    badge: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  },
  cyber: {
    bg: "bg-purple-500",
    text: "text-purple-400",
    badge: "bg-purple-600/20 text-purple-400 border-purple-500/30",
  },
  military: {
    bg: "bg-red-500",
    text: "text-red-400",
    badge: "bg-red-600/20 text-red-400 border-red-500/30",
  },
  economic: {
    bg: "bg-emerald-500",
    text: "text-emerald-400",
    badge: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
  },
};

interface CategoryAnalytics {
  category: string;
  count: number;
  trend: string;
  summary: string;
}

interface SourceData {
  source: string;
  count: number;
}

interface AnalyticsData {
  categories: CategoryAnalytics[];
  bySource: SourceData[];
  totalAlerts: number;
  generated_at: string;
}

interface InsightsData {
  briefing: string;
  generated_at: string;
  alert_count: number;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "rising") return <TrendingUp className="size-4 text-emerald-400" />;
  if (trend === "declining") return <TrendingDown className="size-4 text-red-400" />;
  return <Minus className="size-4 text-amber-400" />;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, insightsRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/insights"),
      ]);
      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
      if (insightsRes.ok) {
        setInsights(await insightsRes.json());
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxSourceCount =
    analytics?.bySource?.reduce((max, s) => Math.max(max, s.count), 0) || 1;

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-auto pt-12">
        <div className="mx-auto max-w-5xl p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Intelligence analysis and threat assessment
              {analytics?.generated_at && (
                <span className="ml-2 text-xs">
                  | Updated {new Date(analytics.generated_at).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          {loading ? (
            <AnalyticsSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Panel 1: Threat Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-red-400" />
                    <CardTitle className="text-sm">Threat Overview</CardTitle>
                    {analytics?.totalAlerts !== undefined && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {analytics.totalAlerts} total signals
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Category threat levels and trend analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.categories && analytics.categories.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.categories.map((cat) => {
                        const colors = CATEGORY_COLORS[cat.category] || {
                          bg: "bg-zinc-500",
                          text: "text-zinc-400",
                          badge: "bg-zinc-600/20 text-zinc-400 border-zinc-500/30",
                        };
                        return (
                          <div
                            key={cat.category}
                            className="rounded-md border px-4 py-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="outline"
                                  className={cn("capitalize text-xs", colors.badge)}
                                >
                                  {cat.category}
                                </Badge>
                                <span className="text-lg font-bold tabular-nums">
                                  {cat.count}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  alerts
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <TrendIcon trend={cat.trend} />
                                <span className="text-xs capitalize text-muted-foreground">
                                  {cat.trend}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {cat.summary}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No threat data available. Alerts are being monitored.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Panel 2: Source Distribution */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Database className="size-4 text-blue-400" />
                      <CardTitle className="text-sm">
                        Source Distribution
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Alert volume by intelligence source
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.bySource && analytics.bySource.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.bySource
                          .sort((a, b) => b.count - a.count)
                          .map((src) => (
                            <div key={src.source}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-medium truncate mr-2">
                                  {src.source}
                                </span>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {src.count}
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-accent">
                                <div
                                  className="h-2 rounded-full bg-blue-500 transition-all"
                                  style={{
                                    width: `${(src.count / maxSourceCount) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No source data available.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Panel 3: Category Breakdown */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="size-4 text-emerald-400" />
                      <CardTitle className="text-sm">
                        Category Breakdown
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Alert distribution by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.categories && analytics.categories.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.categories.map((cat) => {
                          const colors = CATEGORY_COLORS[cat.category] || {
                            bg: "bg-zinc-500",
                            text: "text-zinc-400",
                            badge: "bg-zinc-600/20 text-zinc-400 border-zinc-500/30",
                          };
                          const pct =
                            analytics.totalAlerts > 0
                              ? Math.round(
                                  (cat.count / analytics.totalAlerts) * 100
                                )
                              : 0;
                          return (
                            <div key={cat.category}>
                              <div className="mb-1 flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "capitalize text-[10px]",
                                    colors.badge
                                  )}
                                >
                                  {cat.category}
                                </Badge>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {cat.count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-accent">
                                <div
                                  className={cn(
                                    "h-2 rounded-full transition-all",
                                    colors.bg
                                  )}
                                  style={{
                                    width: `${pct}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No category data available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Panel 4: AI Situation Summary */}
              <Card className="border-amber-500/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-amber-400" />
                    <CardTitle className="text-sm text-amber-400">
                      AI Situation Summary
                    </CardTitle>
                    {insights?.generated_at && (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        Generated{" "}
                        {new Date(insights.generated_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    AI-generated intelligence assessment based on current OSINT signals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {insights?.briefing ||
                      "AI situation summary unavailable. Check API connectivity in Settings."}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
