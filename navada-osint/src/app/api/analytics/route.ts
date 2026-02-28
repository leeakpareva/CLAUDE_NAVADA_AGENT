import { NextResponse } from "next/server";
import { getAlerts } from "../alerts/route";
import { getCachedAnalytics } from "@/lib/openai";

export async function GET() {
  try {
    const alerts = await getAlerts();

    const categories = await getCachedAnalytics(alerts);

    // Compute alerts by source
    const sourceMap: Record<string, number> = {};
    for (const a of alerts) {
      sourceMap[a.source] = (sourceMap[a.source] || 0) + 1;
    }
    const bySource = Object.entries(sourceMap).map(([source, count]) => ({
      source,
      count,
    }));

    // Compute alerts by hour (last 24h distribution)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const hourBuckets: Record<number, number> = {};
    for (let h = 0; h < 24; h++) {
      hourBuckets[h] = 0;
    }
    for (const a of alerts) {
      const ts = new Date(a.published_at).getTime();
      if (ts >= oneDayAgo) {
        const hour = new Date(a.published_at).getHours();
        hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
      }
    }
    const byHour = Object.entries(hourBuckets).map(([hour, count]) => ({
      hour: Number(hour),
      count,
    }));

    return NextResponse.json({
      categories,
      bySource,
      byHour,
      totalAlerts: alerts.length,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics route error:", error);
    return NextResponse.json(
      {
        categories: [],
        bySource: [],
        byHour: [],
        totalAlerts: 0,
        generated_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
