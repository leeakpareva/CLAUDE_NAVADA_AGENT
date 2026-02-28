"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  Linkedin,
  Sparkles,
  FlaskConical,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertFeed } from "@/components/alert-feed";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_ACTIONS = [
  {
    label: "Voice Command",
    icon: Mic,
    href: "#",
    onClick: () => {},
  },
  {
    label: "LinkedIn",
    icon: Linkedin,
    href: "https://www.linkedin.com",
    external: true,
  },
  {
    label: "AI Digest",
    icon: Sparkles,
    href: "#",
    action: "digest",
  },
  {
    label: "JupyterLab",
    icon: FlaskConical,
    href: "http://192.168.0.36:8888",
    external: true,
  },
];

function AIInsightsCompact() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/insights");
        if (res.ok) {
          const data = await res.json();
          if (data.briefing) {
            // Get first 2 sentences
            const sentences = data.briefing.match(/[^.!?]+[.!?]+/g) || [];
            setSummary(sentences.slice(0, 2).join(" ").trim());
          }
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
    const id = setInterval(fetchInsights, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="space-y-1.5 p-3 border-t">
        <div className="flex items-center gap-1.5 mb-1">
          <Brain className="size-3 text-amber-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
            AI Insights
          </span>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="border-t p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Brain className="size-3 text-amber-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">
          AI Insights
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-4">
        {summary}
      </p>
    </div>
  );
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);

  async function handleDigest() {
    try {
      await fetch("/api/digest", { method: "POST" });
    } catch {
      // silent fail
    }
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
        expanded ? "w-80" : "w-0"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-3 z-10 flex size-6 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-foreground"
      >
        {expanded ? (
          <ChevronLeft className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
      </button>

      {expanded && (
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AlertFeed />
          </div>

          <AIInsightsCompact />

          <div className="border-t p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_ACTIONS.map((action) => {
                if (action.action === "digest") {
                  return (
                    <Button
                      key={action.label}
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-2 text-xs"
                      onClick={handleDigest}
                    >
                      <action.icon className="size-3.5" />
                      {action.label}
                    </Button>
                  );
                }
                if (action.external) {
                  return (
                    <Button
                      key={action.label}
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-2 text-xs"
                      asChild
                    >
                      <a
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <action.icon className="size-3.5" />
                        {action.label}
                      </a>
                    </Button>
                  );
                }
                return (
                  <Button
                    key={action.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 text-xs"
                    onClick={action.onClick}
                  >
                    <action.icon className="size-3.5" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
