"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  Linkedin,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertFeed } from "@/components/alert-feed";

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
