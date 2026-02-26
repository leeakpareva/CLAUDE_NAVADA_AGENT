"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { WorldMonitorEmbed } from "@/components/world-monitor-embed";

export default function SituationRoom() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 pt-12">
        <Sidebar />
        <main className="flex-1 p-2">
          <WorldMonitorEmbed />
        </main>
      </div>
    </div>
  );
}
