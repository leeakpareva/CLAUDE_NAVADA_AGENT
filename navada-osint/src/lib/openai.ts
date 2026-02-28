import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateInsights(
  alerts: { title: string; source: string; category: string; snippet?: string }[]
): Promise<string> {
  const headlines = alerts
    .slice(0, 10)
    .map((a) => `[${a.category.toUpperCase()}] ${a.title} (${a.source})`)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are NAVADA, an elite intelligence analyst. Provide concise, actionable intelligence briefings. Use professional military/intelligence terminology. No markdown headers — just clean paragraphs.",
        },
        {
          role: "user",
          content: `Based on these current OSINT headlines, produce a 3-paragraph intelligence briefing covering: (1) Key developments and situational overview, (2) Emerging threats and risk indicators, (3) Recommended watch areas and priority signals.\n\nHeadlines:\n${headlines}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "Intelligence briefing unavailable.";
  } catch (error) {
    console.error("generateInsights error:", error);
    return "Intelligence briefing temporarily unavailable. OSINT feeds are still being monitored.";
  }
}

export async function generateBrief(
  topic: string,
  category: string,
  context: string
): Promise<{ title: string; content: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are NAVADA, an elite intelligence analyst. Write structured intelligence briefs. Include assessment confidence levels (HIGH/MODERATE/LOW). Be factual and concise.",
        },
        {
          role: "user",
          content: `Write an intelligence brief about: ${topic}\nCategory: ${category}\nContext: ${context}\n\nFormat: Start with a one-line BLUF (Bottom Line Up Front), then 2-3 analysis paragraphs, then a RECOMMENDATION section.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return {
      title: topic,
      content: response.choices[0]?.message?.content || "Brief generation failed.",
    };
  } catch (error) {
    console.error("generateBrief error:", error);
    return {
      title: topic,
      content: "Brief generation temporarily unavailable. Please retry later.",
    };
  }
}

export async function generateAlertSummary(
  alerts: { title: string; category: string }[]
): Promise<{ category: string; count: number; trend: string; summary: string }[]> {
  const grouped: Record<string, number> = {};
  for (const a of alerts) {
    grouped[a.category] = (grouped[a.category] || 0) + 1;
  }

  const categories = Object.entries(grouped).map(([cat, count]) => ({
    category: cat,
    count,
  }));

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are NAVADA intelligence analytics. Return ONLY valid JSON array.",
        },
        {
          role: "user",
          content: `Given these alert categories and counts from the last 24h:\n${JSON.stringify(categories)}\n\nReturn a JSON array where each item has: category (string), count (number), trend ("rising"|"stable"|"declining"), summary (one sentence). Include all categories.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const text = response.choices[0]?.message?.content || "[]";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("generateAlertSummary error:", error);
    return categories.map((c) => ({
      ...c,
      trend: "stable",
      summary: `${c.count} alerts detected in ${c.category} category.`,
    }));
  }
}

// In-memory cache
let insightsCache: { data: string; timestamp: number } | null = null;
let analyticsCache: { data: { category: string; count: number; trend: string; summary: string }[]; timestamp: number } | null = null;
const INSIGHTS_TTL = 30 * 60 * 1000; // 30 min
const ANALYTICS_TTL = 15 * 60 * 1000; // 15 min

export async function getCachedInsights(
  alerts: { title: string; source: string; category: string; snippet?: string }[]
): Promise<string> {
  if (insightsCache && Date.now() - insightsCache.timestamp < INSIGHTS_TTL) {
    return insightsCache.data;
  }
  const data = await generateInsights(alerts);
  insightsCache = { data, timestamp: Date.now() };
  return data;
}

export async function getCachedAnalytics(
  alerts: { title: string; category: string }[]
): Promise<{ category: string; count: number; trend: string; summary: string }[]> {
  if (analyticsCache && Date.now() - analyticsCache.timestamp < ANALYTICS_TTL) {
    return analyticsCache.data;
  }
  const data = await generateAlertSummary(alerts);
  analyticsCache = { data, timestamp: Date.now() };
  return data;
}
