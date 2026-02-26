"use client";

import {
  TrendingUp,
  Globe,
  Database,
  Activity,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const PANELS = [
  {
    title: "Threat Trends",
    description: "Track emerging threats and risk trajectories over time",
    icon: TrendingUp,
  },
  {
    title: "Regional Activity",
    description: "Geospatial breakdown of intelligence signals by region",
    icon: Globe,
  },
  {
    title: "Source Analysis",
    description: "Evaluate reliability and volume across OSINT sources",
    icon: Database,
  },
  {
    title: "Alert Volume",
    description: "Monitor alert frequency, spikes, and anomalies",
    icon: Activity,
  },
];

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-auto pt-12">
        <div className="mx-auto max-w-5xl p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Intelligence analysis and visualization
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {PANELS.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="border-dashed">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{title}</CardTitle>
                      <CardDescription className="text-xs">
                        Coming Soon &mdash; Vizro Integration
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
