import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST() {
  try {
    const output = await new Promise<string>((resolve, reject) => {
      exec(
        'node "C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/ai-news-mailer.js"',
        { timeout: 30000 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve(stdout);
        }
      );
    });

    return NextResponse.json({
      success: true,
      message: "Digest triggered successfully",
      output,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message, output: null },
      { status: 500 }
    );
  }
}
