"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ComplaintForm } from "./complaint-form";
import { ResultsPanel } from "./results-panel";
import type { AnalyzeRequestBody, TriageResult } from "@/lib/types";

export function TriageWorkspace() {
  const [result, setResult] = useState<TriageResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(request: AnalyzeRequestBody) {
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/triage/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <ComplaintForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
      <div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Couldn&apos;t analyze this complaint</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!result && !error && (
          <div className="text-muted-foreground flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed text-sm">
            Enter a booking ID and complaint details to see a recommendation.
          </div>
        )}
        {result && <ResultsPanel result={result} />}
      </div>
    </div>
  );
}
