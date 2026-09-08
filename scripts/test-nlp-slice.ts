/**
 * AI Proof Slice Test Suite: Expense Natural Language Parser
 * 
 * Verifies the 4 core guarantees:
 * 1. Boundary: Model extracts slots, App dictates taxonomy, limits, and dates.
 * 2. Validation: Strict Zod schema rejects malformed/poisoned LLM outputs.
 * 3. Fallback: Deterministic regex/heuristic engine activates on LLM failure or invalid outputs.
 * 4. Staging Separation: AI output remains staged (requires user confirmation before ledger write).
 */

import {
  parseExpenseNaturalLanguage,
  fallbackHeuristicParser,
  nlpModelOutputSchema,
  StagedNLPResult,
} from "../src/lib/nlp-parser";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

async function runAllTests() {
  console.log("\n=======================================================");
  console.log("  TEST SUITE: AI Proof Slice (NLP Expense Parser)");
  console.log("=======================================================\n");

  // --------------------------------------------------------------------------
  // TEST 1: BOUNDARY & VALIDATION (Valid Model Output)
  // --------------------------------------------------------------------------
  console.log("[1] Boundary & Schema Validation (Valid Model Output)");
  const validMock = {
    action: "transaction",
    type: "EXPENSE",
    title: "Swiggy dinner with friends",
    amount: 580,
    category: "Food & Dining",
    date: "2026-09-08",
    confidence: 0.95,
  };

  const parsedValid = nlpModelOutputSchema.safeParse(validMock);
  assert(parsedValid.success, "Valid model payload passes Zod schema");
  if (parsedValid.success) {
    assert(parsedValid.data.amount === 580, "Amount preserved accurately as positive number");
    assert(parsedValid.data.category === "Food & Dining", "Category properly preserved");
  }

  // --------------------------------------------------------------------------
  // TEST 2: VALIDATION GUARDS (Reject Poisoned / Malformed Model Output)
  // --------------------------------------------------------------------------
  console.log("\n[2] Validation Guards: Rejection of Invalid Model Outputs");

  // 2a. Negative amount
  const negativeAmount = { ...validMock, amount: -150 };
  const checkNegative = nlpModelOutputSchema.safeParse(negativeAmount);
  assert(!checkNegative.success, "Rejects negative amounts (-150)");

  // 2b. Absurd amount (overflow guard)
  const hugeAmount = { ...validMock, amount: 99_000_000 };
  const checkHuge = nlpModelOutputSchema.safeParse(hugeAmount);
  assert(!checkHuge.success, "Rejects amounts exceeding safe ceiling (>10,000,000)");

  // 2c. Empty title
  const emptyTitle = { ...validMock, title: "   " };
  const checkEmptyTitle = nlpModelOutputSchema.safeParse(emptyTitle);
  assert(!checkEmptyTitle.success, "Rejects empty/whitespace title");

  // 2d. Invalid date format
  const invalidDate = { ...validMock, date: "yesterday" };
  const checkDate = nlpModelOutputSchema.safeParse(invalidDate);
  assert(!checkDate.success, "Rejects non-ISO date string ('yesterday')");

  // 2e. Hallucinated category normalized to app taxonomy
  const hallucinatedCategory = { ...validMock, category: "Gourmet Extravaganza" };
  const checkCategory = nlpModelOutputSchema.safeParse(hallucinatedCategory);
  assert(
    checkCategory.success && checkCategory.data.category === "Other",
    "Normalizes unknown/hallucinated category to 'Other' app category"
  );

  // --------------------------------------------------------------------------
  // TEST 3: FALLBACK RESILIENCE (Deterministic Heuristic Engine)
  // --------------------------------------------------------------------------
  console.log("\n[3] Fallback Resilience: Deterministic Heuristic Engine");

  // 3a. Direct fallback test
  const heuristicResult = fallbackHeuristicParser("Spent 750 on uber to airport");
  assert(heuristicResult.source === "FALLBACK_EXTRACTED", "Source tagged as FALLBACK_EXTRACTED");
  assert(heuristicResult.amount === 750, "Extracted amount 750 via regex");
  assert(heuristicResult.category === "Transportation", "Matched category 'Transportation' for uber");
  assert(heuristicResult.requiresConfirmation === true, "Requires user confirmation before ledger write");

  // 3b. Simulated Groq 429 Rate Limit
  const mock429Fetch = async () =>
    new Response(JSON.stringify({ error: "rate limit" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });

  const rateLimitResult = await parseExpenseNaturalLanguage({
    text: "Paid 1200 for electricity bill",
    apiKey: "dummy-key",
    fetchFn: mock429Fetch as unknown as typeof fetch,
  });

  assert(rateLimitResult.source === "FALLBACK_EXTRACTED", "Falls back gracefully on HTTP 429 Rate Limit");
  assert(rateLimitResult.amount === 1200, "Extracts amount 1200 despite upstream 429 failure");
  assert(rateLimitResult.category === "Bills & Utilities", "Detects 'Bills & Utilities' for electricity bill");
  assert(
    rateLimitResult.warning?.includes("rate limit") ?? false,
    "Provides transparent warning message for user UI"
  );

  // 3c. Simulated Groq returning malformed non-JSON
  const mockGibberishFetch = async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: "Sure! Here is your transaction: I could not figure it out." } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  const gibberishResult = await parseExpenseNaturalLanguage({
    text: "Bought groceries at Zepto for 450",
    apiKey: "dummy-key",
    fetchFn: mockGibberishFetch as unknown as typeof fetch,
  });

  assert(gibberishResult.source === "FALLBACK_EXTRACTED", "Falls back when model outputs invalid JSON");
  assert(gibberishResult.amount === 450, "Extracts amount 450 from Zepto input");
  assert(gibberishResult.category === "Groceries", "Detects Groceries category");

  // --------------------------------------------------------------------------
  // TEST 4: DATA SEPARATION & AUDIT TRAIL (No Silent Overwrite)
  // --------------------------------------------------------------------------
  console.log("\n[4] Data Separation & Staging Guarantees");

  // Simulated successful LLM parse
  const mockSuccessFetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: "transaction",
                type: "EXPENSE",
                title: "Zepto Quick Delivery",
                amount: 320,
                category: "Groceries",
                date: "2026-09-08",
                confidence: 0.96,
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  const aiResult: StagedNLPResult = await parseExpenseNaturalLanguage({
    text: "Spent 320 on Zepto",
    apiKey: "dummy-key",
    fetchFn: mockSuccessFetch as unknown as typeof fetch,
  });

  assert(aiResult.source === "AI_PROPOSED", "Source marked as AI_PROPOSED");
  assert(aiResult.requiresConfirmation === true, "Hard guarantee: requires user confirmation before write");
  assert(aiResult.amount === 320, "Validated amount is 320");
  assert(aiResult.original === "Spent 320 on Zepto", "Preserves raw input text for audit traceability");

  console.log("\n=======================================================");
  console.log(`  RESULTS: ${passedCount} passed, ${failedCount} failed`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
