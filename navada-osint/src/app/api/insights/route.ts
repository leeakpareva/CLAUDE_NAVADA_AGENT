import { NextResponse } from "next/server";
import { getAlerts } from "../alerts/route";
import { getCachedInsights } from "@/lib/openai";

export async function GET() {
  try {
    const alerts = await getAlerts();

    const briefing = await getCachedInsights(alerts);

    return NextResponse.json({
      briefing,
      generated_at: new Date().toISOString(),
      alert_count: alerts.length,
    });
  } catch (error) {
    console.error("Insights route error:", error);
    return NextResponse.json(
      {
        briefing: "Intelligence briefing temporarily unavailable.",
        generated_at: new Date().toISOString(),
        alert_count: 0,
      },
      { status: 500 }
    );
  }
}
