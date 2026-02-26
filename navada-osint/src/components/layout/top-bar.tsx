"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Shield,
  Crosshair,
  FileText,
  Map,
  BarChart3,
  FlaskConical,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceStatusDots } from "@/components/service-status";

const NAV_LINKS = [
  { href: "/", label: "Situation Room", icon: Crosshair },
  { href: "/briefs", label: "Briefs", icon: FileText },
  { href: "/strategic-map", label: "Strategic Map", icon: Map },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/data-lab", label: "Data Lab", icon: FlaskConical },
  { href: "/settings", label: "Settings", icon: Settings },
];

function UTCClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toISOString().slice(11, 19) + " UTC"
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      {time}
    </span>
  );
}

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <span className="text-sm font-semibold tracking-wide">
            NAVADA OSINT
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <ServiceStatusDots />
        <UTCClock />
      </div>
    </header>
  );
}
