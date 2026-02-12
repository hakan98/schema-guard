"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { SchemaInput } from "@/components/schema-input";
import { ComparisonView } from "@/components/comparison-view";
import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import type { ComparisonResult, AIAnalysisResult } from "@/types";

export default function Home() {
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = (result: ComparisonResult) => {
    setComparisonResult(result);
    setAiResult(null);
  };

  const handleAnalyze = (result: AIAnalysisResult) => {
    setAiResult(result);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Hero gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h2 className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Track API Changes. Protect Your Frontend.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Compare OpenAPI schemas, detect breaking changes instantly, and get
            AI-powered analysis of how changes impact your frontend components
            and TypeScript interfaces.
          </p>
        </div>

        {/* Schema Input */}
        <SchemaInput
          onCompare={handleCompare}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        {/* Results */}
        {(comparisonResult || isLoading) && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ComparisonView result={comparisonResult} />
            <AIAnalysisPanel result={aiResult} isLoading={isLoading && !aiResult} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>
          Schema<span className="text-violet-500">Guard</span> — Built with
          Next.js, Shadcn/UI & OpenAI
        </p>
      </footer>
    </div>
  );
}
