import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export interface NLPResult {
  action: "transaction" | "reminder" | "budget" | "recurring";
  type?: "INCOME" | "EXPENSE";
  title: string;
  amount: number;
  category: string;
  date: string;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  period?: "WEEKLY" | "MONTHLY" | "YEARLY";
  confidence: number;
  original: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return NextResponse.json({ error: "Please enter a valid description" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

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
            content: `You are an expense parser. Extract structured data from natural language text about financial transactions, reminders, budgets, or recurring payments.

Today's date is ${today}. Current month: ${currentMonth}, year: ${currentYear}.

RESPOND WITH ONLY VALID JSON. No explanation, no markdown, just the JSON object.

Rules:
- "action" must be one of: "transaction", "reminder", "budget", "recurring"
- For transactions: include "type" ("INCOME" or "EXPENSE"), "title", "amount", "category", "date"
- For reminders: action="reminder", include "title", "amount" (0 if not mentioned), "date"
- For budgets: action="budget", include "category", "amount", "period" ("MONTHLY", "WEEKLY", "YEARLY")
- For recurring: action="recurring", include "type", "title", "amount", "category", "frequency" ("DAILY", "WEEKLY", "MONTHLY", "YEARLY"), "date" (next due date)
- "confidence" is 0.0 to 1.0 based on how clear the input is

Category detection:
- Food words (swiggy, zomato, restaurant, lunch, dinner, breakfast, coffee, chai, pizza, biryani) → "Food & Dining"
- Transport words (uber, ola, petrol, fuel, cab, auto, metro, train, bus, rapido) → "Transportation"
- Shopping words (amazon, flipkart, myntra, bought, purchase) → "Shopping"
- Bills words (electricity, wifi, internet, recharge, mobile, water, gas) → "Bills & Utilities"
- Subscription words (netflix, spotify, chatgpt, subscription, premium) → "Subscriptions"
- Rent words (rent, housing, room rent) → "Rent & Housing"
- Entertainment words (movie, concert, game, bowling, pvr) → "Entertainment"
- Grocery words (bigbasket, dmart, zepto, grocery, vegetables, fruits) → "Groceries"
- Health words (doctor, medicine, pharmacy, gym, hospital, dental) → "Healthcare"
- Education words (course, udemy, book, tutorial, exam) → "Education"
- Travel words (hotel, flight, trip, vacation, booking) → "Travel"
- Income words (salary, freelance, dividend, cashback, refund, bonus, sold) → INCOME type
- "remind" or "don't forget" or "remember to" → action="reminder"
- "every month" or "monthly" or "weekly" or "recurring" or "subscription" → action="recurring"
- "budget" or "limit" or "set budget" → action="budget"

Date parsing:
- "today" → ${today}
- "yesterday" → subtract 1 day from today
- "day before yesterday" → subtract 2 days
- "last friday/monday/etc" → calculate the correct date
- "25th" or "on 10th" → ${currentYear}-${String(currentMonth).padStart(2, "0")}-DD
- "next month" → add 1 month
- If no date mentioned: use ${today}

JSON format:
{
  "action": "transaction",
  "type": "EXPENSE",
  "title": "Swiggy dinner",
  "amount": 450,
  "category": "Food & Dining",
  "date": "${today}",
  "frequency": null,
  "period": null,
  "confidence": 0.95,
  "original": "the original input text"
}`,
          },
          {
            role: "user",
            content: text.trim(),
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Groq NLP error:", res.status, JSON.stringify(data));
      if (res.status === 429) {
        return NextResponse.json(
          { error: "Rate limit reached. Please wait a moment." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "AI parsing failed" }, { status: 500 });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Parse the JSON response, stripping any markdown code blocks
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed: NLPResult = JSON.parse(cleaned);
    parsed.original = text.trim();

    // Validate required fields
    if (!parsed.action || !parsed.title || parsed.amount == null) {
      return NextResponse.json(
        { error: "Could not understand the input. Try being more specific." },
        { status: 400 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("NLP parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse input. Try rephrasing." },
      { status: 500 }
    );
  }
}
