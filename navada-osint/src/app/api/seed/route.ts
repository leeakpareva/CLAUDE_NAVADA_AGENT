import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { generateBrief } from "@/lib/openai";
import type { Brief } from "@/lib/types";

const SEED_BRIEFS = [
  {
    topic: "Global Cybersecurity Threat Landscape Q1 2026",
    category: "cyber",
    context:
      "Recent surge in ransomware attacks targeting critical infrastructure, state-sponsored APT campaigns, and emerging AI-powered attack vectors.",
  },
  {
    topic: "NATO Eastern Flank Force Posture Assessment",
    category: "military",
    context:
      "Ongoing force rebalancing in Baltic states, Poland forward deployment, and Nordic NATO integration following Finland and Sweden accession.",
  },
  {
    topic: "Middle East Energy Infrastructure Risk Analysis",
    category: "economic",
    context:
      "Red Sea shipping disruptions, Gulf state diversification strategies, and regional tensions impacting global energy supply chains.",
  },
  {
    topic: "South China Sea Maritime Disputes Update",
    category: "geopolitical",
    context:
      "Escalating territorial claims, FONOPS frequency, ASEAN diplomatic efforts, and implications for Indo-Pacific stability.",
  },
  {
    topic: "AI-Enabled Disinformation Campaign Tracking",
    category: "cyber",
    context:
      "Deepfake proliferation, LLM-generated propaganda, social media manipulation networks, and countermeasures by Western intelligence agencies.",
  },
];

export async function POST() {
  try {
    const db = await getDb();

    // Check if briefs already exist to avoid duplicates
    const stmt = db.prepare("SELECT COUNT(*) as count FROM briefs");
    let existingCount = 0;
    if (stmt.step()) {
      const row = stmt.getAsObject() as { count: number };
      existingCount = row.count;
    }
    stmt.free();

    if (existingCount > 0) {
      return NextResponse.json(
        {
          message: `Database already contains ${existingCount} briefs. Skipping seed.`,
          seeded: false,
          existing_count: existingCount,
        },
        { status: 200 }
      );
    }

    const created: Brief[] = [];

    for (const seed of SEED_BRIEFS) {
      const result = await generateBrief(seed.topic, seed.category, seed.context);

      db.run(
        "INSERT INTO briefs (title, content, category, source) VALUES (?, ?, ?, ?)",
        [result.title, result.content, seed.category, "NAVADA AI"]
      );
      saveDb();

      const fetchStmt = db.prepare(
        "SELECT * FROM briefs WHERE id = last_insert_rowid()"
      );
      if (fetchStmt.step()) {
        created.push(fetchStmt.getAsObject() as unknown as Brief);
      }
      fetchStmt.free();
    }

    return NextResponse.json(
      {
        message: `Seeded ${created.length} intelligence briefs.`,
        seeded: true,
        briefs: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seed route error:", error);
    return NextResponse.json(
      { error: "Failed to seed briefs", details: String(error) },
      { status: 500 }
    );
  }
}
