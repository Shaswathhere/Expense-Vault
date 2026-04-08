"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";

export default function InsightsPage() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: txData } = useQuery({
    queryKey: ["transactions", "insights"],
    queryFn: async () => {
      const res = await fetch("/api/transactions?limit=100");
      return res.json();
    },
  });

  async function generateInsights() {
    if (!txData?.transactions?.length) return;
    setLoading(true);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: txData.transactions }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate insights");
      }
      const data = await res.json();
      setAnalysis(data.insights);
    } catch (err) {
      setAnalysis(
        err instanceof Error
          ? err.message
          : "AI insights require configuring the Groq API key. Add GROQ_API_KEY to your environment variables."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered analysis of your spending habits
          </p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={loading || !txData?.transactions?.length}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {analysis ? "Re-analyze" : "Analyze Spending"}
        </Button>
      </div>

      {!analysis && !loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Get personalized insights</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Click &quot;Analyze Spending&quot; to get AI-powered recommendations
              based on your transaction history.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Analyzing your spending patterns...
            </p>
          </CardContent>
        </Card>
      )}

      {analysis && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Spending Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1 prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-li:text-muted-foreground prose-li:marker:text-primary prose-ul:my-2 prose-ol:my-2">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
