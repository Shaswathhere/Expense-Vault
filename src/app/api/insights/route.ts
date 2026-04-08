import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const { transactions } = await req.json();

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions to analyze" },
        { status: 400 }
      );
    }

    const summary = transactions
      .slice(0, 50)
      .map(
        (t: { title: string; amount: number; type: string; category: string; date: string }) =>
          `${t.date}: ${t.type} - ${t.category} - ${t.title} - ₹${t.amount}`
      )
      .join("\n");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a personal finance advisor. Respond in clean markdown format with these sections:

## Spending Overview
Brief summary of total income vs expenses with key numbers.

## Top Spending Categories
Ranked list of highest expense categories with amounts and percentages.

## Savings Opportunities
Specific, actionable tips to reduce spending. Reference actual transactions.

## Financial Health Score
Rate overall health as Excellent/Good/Fair/Needs Attention with a brief reason.

## Action Items
3-4 concrete next steps as a numbered list.

Use **bold** for key numbers. Use bullet points. Keep it under 500 words. All amounts are in Indian Rupees (₹).`,
          },
          {
            role: "user",
            content: `Analyze my recent transactions and give me personalized financial insights:\n\n${summary}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Groq API error:", res.status, JSON.stringify(data));

      if (res.status === 429) {
        return NextResponse.json(
          { error: "AI rate limit reached. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: data?.error?.message || `Groq API returned ${res.status}` },
        { status: 500 }
      );
    }

    const insights =
      data.choices?.[0]?.message?.content || "Unable to generate insights.";

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json(
      { error: "Failed to generate insights. Please try again." },
      { status: 500 }
    );
  }
}
