import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { createHash } from "crypto";
import { OSINT_FEEDS, type Alert } from "@/lib/types";

const parser = new Parser();

let cache: { alerts: Alert[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function hashId(link: string): string {
  return createHash("sha256").update(link).digest("hex").slice(0, 16);
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(cache.alerts, { headers: corsHeaders });
    }

    const results = await Promise.allSettled(
      OSINT_FEEDS.map(async (feed) => {
        const parsed = await parser.parseURL(feed.url);
        return (parsed.items || []).map((item) => ({
          id: hashId(item.link || item.title || ""),
          title: item.title || "Untitled",
          link: item.link || "",
          source: feed.name,
          published_at: item.isoDate || item.pubDate || new Date().toISOString(),
          category: feed.category,
          snippet: item.contentSnippet?.slice(0, 300) || item.content?.slice(0, 300) || "",
        }));
      })
    );

    const alerts: Alert[] = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<Alert[]>).value)
      .sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      )
      .slice(0, 50);

    cache = { alerts, timestamp: Date.now() };

    return NextResponse.json(alerts, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
