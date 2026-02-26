import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import type { Brief } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const category = request.nextUrl.searchParams.get("category");

    let rows: Brief[];
    if (category) {
      const stmt = db.prepare(
        "SELECT * FROM briefs WHERE category = ? ORDER BY created_at DESC"
      );
      stmt.bind([category]);
      rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as Brief);
      }
      stmt.free();
    } else {
      const stmt = db.prepare(
        "SELECT * FROM briefs ORDER BY created_at DESC"
      );
      rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as Brief);
      }
      stmt.free();
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch briefs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, source } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    db.run(
      "INSERT INTO briefs (title, content, category, source) VALUES (?, ?, ?, ?)",
      [title, content, category || "general", source || ""]
    );
    saveDb();

    const stmt = db.prepare(
      "SELECT * FROM briefs WHERE id = last_insert_rowid()"
    );
    let created: Brief | null = null;
    if (stmt.step()) {
      created = stmt.getAsObject() as unknown as Brief;
    }
    stmt.free();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create brief" },
      { status: 500 }
    );
  }
}
