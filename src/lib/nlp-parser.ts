import { z } from "zod";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ExpenseCategory, IncomeCategory } from "./categories";

// ============================================================================
// 1. BOUNDARY DEFINITIONS (What the App Decides vs. What the Model Decides)
// ============================================================================
// The Model Decides:
//   - Slot filling from unstructured human text (detecting titles, amounts, intentions).
//   - Estimating confidence level (0.0 to 1.0).
//
// The App Decides:
//   - Valid action types ("transaction" | "reminder" | "budget" | "recurring").
//   - Official category taxonomy (sanitized against EXPENSE_CATEGORIES / INCOME_CATEGORIES).
//   - Temporal anchoring (reference dates, today, current month/year).
//   - Numeric boundaries (amounts must be positive, reasonable caps).
//   - Persistence (data stays staged in-memory; app never writes to DB automatically).

export type NLPAction = "transaction" | "reminder" | "budget" | "recurring";
export type NLPSource = "AI_PROPOSED" | "FALLBACK_EXTRACTED";

// ============================================================================
// 2. VALIDATION SCHEMA (Untrusted Model Output Verification)
// ============================================================================
export const nlpModelOutputSchema = z.object({
  action: z.enum(["transaction", "reminder", "budget", "recurring"]).default("transaction"),
  type: z.enum(["INCOME", "EXPENSE"]).optional().default("EXPENSE"),
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title exceeds 100 characters")
    .transform((t) => t.replace(/[\r\n]+/g, " ")),
  amount: z.coerce
    .number()
    .positive("Amount must be a positive number")
    .max(10_000_000, "Amount exceeds safe ceiling of 10,000,000"),
  category: z.string().transform((val): string => {
    const clean = val.trim();
    const match = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(
      (c) => c.toLowerCase() === clean.toLowerCase()
    );
    return match || "Other";
  }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((d) => !isNaN(Date.parse(d)), "Invalid calendar date"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional().nullable(),
  period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).optional().nullable(),
  confidence: z.coerce.number().min(0).max(1).default(0.5),
});

export type ValidatedNLPPayload = z.infer<typeof nlpModelOutputSchema>;

// ============================================================================
// 4. SEPARATE STAGING DTO (Prevent Silent Overwrite of Persistent Data)
// ============================================================================
export interface StagedNLPResult {
  action: NLPAction;
  type: "INCOME" | "EXPENSE";
  title: string;
  amount: number;
  category: string;
  date: string;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  period?: "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  confidence: number;
  original: string;
  source: NLPSource;
  engine: string;
  requiresConfirmation: true; // Hard contract: requires user approval before DB write
  warning?: string;
}

// ============================================================================
// 3. DETERMINISTIC FALLBACK (Engaged when LLM is Down, Slow, or Malformed)
// ============================================================================
export function fallbackHeuristicParser(text: string): StagedNLPResult {
  const today = new Date().toISOString().split("T")[0];
  const trimmed = text.trim();

  // 1. Detect Action
  let action: NLPAction = "transaction";
  if (/\b(remind|remember|due on|alert|don't forget)\b/i.test(trimmed)) {
    action = "reminder";
  } else if (/\b(budget|limit|monthly limit|weekly limit|cap at)\b/i.test(trimmed)) {
    action = "budget";
  } else if (/\b(recurring|subscription|every month|monthly|weekly|daily)\b/i.test(trimmed)) {
    action = "recurring";
  }

  // 2. Extract Amount (handles ₹, rs, inr, plain numbers)
  const amountRegex = /(?:₹|rs\.?|inr\s*)?(\d+(?:\.\d{1,2})?)/i;
  const amountMatch = trimmed.match(amountRegex);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  // 3. Detect Income vs Expense
  const isIncome = /\b(salary|freelance|credited|received|cashback|refund|dividend|bonus)\b/i.test(trimmed);
  const type: "INCOME" | "EXPENSE" = isIncome ? "INCOME" : "EXPENSE";

  // 4. Keyword Category Mapping (App taxonomy)
  let category = type === "INCOME" ? "Salary" : "Other";
  if (/\b(swiggy|zomato|dinner|lunch|breakfast|food|coffee|restaurant|chai|pizza|burger|cafe)\b/i.test(trimmed)) {
    category = "Food & Dining";
  } else if (/\b(uber|ola|rapido|metro|petrol|fuel|auto|cab|bus|train|flight)\b/i.test(trimmed)) {
    category = "Transportation";
  } else if (/\b(amazon|flipkart|myntra|clothes|shopping|shoes)\b/i.test(trimmed)) {
    category = "Shopping";
  } else if (/\b(zepto|blinkit|dmart|grocery|groceries|milk|vegetables|fruits)\b/i.test(trimmed)) {
    category = "Groceries";
  } else if (/\b(electricity|wifi|water|recharge|mobile|bill|utility|gas)\b/i.test(trimmed)) {
    category = "Bills & Utilities";
  } else if (/\b(netflix|spotify|youtube|chatgpt|subscription|prime)\b/i.test(trimmed)) {
    category = "Subscriptions";
  } else if (/\b(doctor|medicine|pharmacy|hospital|gym|health)\b/i.test(trimmed)) {
    category = "Healthcare";
  } else if (/\b(movie|cinema|concert|pvr|game|bowling)\b/i.test(trimmed)) {
    category = "Entertainment";
  } else if (/\b(rent|room rent|flat rent|housing)\b/i.test(trimmed)) {
    category = "Rent & Housing";
  }

  // 5. Clean Title: strip detected amounts and currency symbols
  let title = trimmed
    .replace(/(?:₹|rs\.?|inr\s*)?\d+(?:\.\d{1,2})?/gi, "")
    .replace(/\b(spent|paid|for|at|on|today|yesterday|tomorrow)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) {
    title = `${category} ${action === "budget" ? "Budget" : "Expense"}`;
  }

  return {
    action,
    type,
    title: title.slice(0, 100),
    amount: amount > 0 ? amount : 100, // Safe default placeholder
    category,
    date: today,
    frequency: action === "recurring" ? "MONTHLY" : null,
    period: action === "budget" ? "MONTHLY" : null,
    confidence: 0.35, // Low confidence signals fallback
    original: trimmed,
    source: "FALLBACK_EXTRACTED",
    engine: "heuristic-rules-v1",
    requiresConfirmation: true,
    warning: "AI model unavailable or rate-limited. Extracted via rule-based fallback.",
  };
}

// ============================================================================
// ORCHESTRATOR: BOUNDARY CONTROLLER
// ============================================================================
export interface ParseExpenseOptions {
  text: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export async function parseExpenseNaturalLanguage({
  text,
  apiKey,
  fetchFn = fetch,
  timeoutMs = 6000,
}: ParseExpenseOptions): Promise<StagedNLPResult> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) {
    throw new Error("Input text is too short to parse");
  }

  // If no API key provided, directly execute deterministic fallback
  if (!apiKey) {
    return fallbackHeuristicParser(trimmed);
  }

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  try {
    // LLM call wrapped with strict timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expense parser. Extract structured data from natural language text about financial transactions, reminders, budgets, or recurring payments.
Today's date is ${today}. Current month: ${currentMonth}, year: ${currentYear}.

RESPOND WITH ONLY A RAW VALID JSON OBJECT. Do not wrap in markdown or backticks.
Schema rules:
- action: "transaction" | "reminder" | "budget" | "recurring"
- type: "INCOME" | "EXPENSE"
- title: string (concise description)
- amount: positive number
- category: choose closest from: ${EXPENSE_CATEGORIES.join(", ")}, ${INCOME_CATEGORIES.join(", ")}
- date: YYYY-MM-DD
- frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" (for recurring) or null
- period: "WEEKLY" | "MONTHLY" | "YEARLY" (for budget) or null
- confidence: number between 0.0 and 1.0`,
          },
          {
            role: "user",
            content: trimmed,
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Groq API returned HTTP ${res.status}. Falling back to heuristics.`);
      const fallback = fallbackHeuristicParser(trimmed);
      if (res.status === 429) {
        fallback.warning = "AI rate limit reached. Extracted via rule-based fallback.";
      }
      return fallback;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("Groq returned empty response. Falling back.");
      return fallbackHeuristicParser(trimmed);
    }

    // Clean any markdown formatting
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    let unverified: unknown;
    try {
      unverified = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("Model output is not valid JSON. Falling back.", parseErr);
      return fallbackHeuristicParser(trimmed);
    }

    // Step 2: Runtime schema validation against Zod
    const validationResult = nlpModelOutputSchema.safeParse(unverified);
    if (!validationResult.success) {
      console.warn(
        "Model output failed schema validation. Falling back.",
        validationResult.error.issues
      );
      return fallbackHeuristicParser(trimmed);
    }

    // Step 4: Staged result return (not persisted to DB)
    const valid = validationResult.data;
    return {
      action: valid.action,
      type: valid.type ?? "EXPENSE",
      title: valid.title,
      amount: valid.amount,
      category: valid.category,
      date: valid.date,
      frequency: valid.frequency,
      period: valid.period,
      confidence: valid.confidence,
      original: trimmed,
      source: "AI_PROPOSED",
      engine: "llama-3.3-70b-versatile",
      requiresConfirmation: true,
    };
  } catch (err) {
    console.warn("Exception during AI extraction pipeline. Falling back.", err);
    return fallbackHeuristicParser(trimmed);
  }
}
