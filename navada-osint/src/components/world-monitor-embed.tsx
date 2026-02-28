"use client";

import { useState, useRef, useCallback } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const MAP_STYLES = [
  { id: "dark", label: "Dark", color: "#1a1a2e" },
  { id: "light", label: "Light", color: "#e8e8e8" },
  { id: "positron", label: "Gray", color: "#6b7280" },
  { id: "dark-clean", label: "Stealth", color: "#0d0d1a" },
  { id: "positron-clean", label: "Minimal", color: "#9ca3af" },
] as const;

export function WorldMonitorEmbed() {
  const [loading, setLoading] = useState(true);
  const [showStyles, setShowStyles] = useState(false);
  const [activeStyle, setActiveStyle] = useState("dark");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const setMapStyle = useCallback((styleId: string) => {
    setActiveStyle(styleId);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "setMapStyle", style: styleId },
      "*"
    );
    setShowStyles(false);
  }, []);

  return (
    <div className="relative size-full">
      {loading && (
        <Skeleton className="absolute inset-0 rounded-lg" />
      )}
      <iframe
        ref={iframeRef}
        src="http://192.168.0.36:4001"
        title="NAVADA Global Monitor"
        className="size-full border-0 rounded-lg"
        allow="fullscreen; geolocation"
        onLoad={() => setLoading(false)}
      />

      {/* Color toggle button */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card"
          onClick={() => setShowStyles(!showStyles)}
        >
          <Palette className="size-3.5" />
          <span className="text-xs">Map Style</span>
        </Button>

        {showStyles && (
          <div className="absolute right-0 top-10 w-40 rounded-lg border bg-card/95 backdrop-blur-sm p-2 shadow-lg">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Map Color
            </p>
            {MAP_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setMapStyle(style.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent",
                  activeStyle === style.id && "bg-accent font-medium"
                )}
              >
                <span
                  className="size-4 rounded-full border border-border/50"
                  style={{ backgroundColor: style.color }}
                />
                {style.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
