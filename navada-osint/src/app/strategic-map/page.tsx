"use client";

import { TopBar } from "@/components/layout/top-bar";
import { EmbedFrame } from "@/components/embed-frame";

export default function StrategicMapPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="flex-1 pt-12">
        <EmbedFrame
          url="http://192.168.0.36:3001"
          title="Strategic Map - Excalidraw"
        />
      </main>
    </div>
  );
}
