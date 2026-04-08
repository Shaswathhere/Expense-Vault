import { fetchExchangeRates } from "@/lib/currencies";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const data = await fetchExchangeRates();
    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
