import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseExpenseNaturalLanguage, StagedNLPResult } from "@/lib/nlp-parser";

export type NLPResult = StagedNLPResult;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter a valid expense or reminder description" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    // Orchestrator: attempts LLM -> validates via Zod -> falls back to deterministic heuristics
    const result = await parseExpenseNaturalLanguage({
      text,
      apiKey,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("NLP route error:", err);
    return NextResponse.json(
      { error: "Failed to process input. Please try again." },
      { status: 500 }
    );
  }
}
