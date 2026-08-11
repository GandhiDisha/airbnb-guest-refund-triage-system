"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CaseActionInput, RefundDecision, TriageResult } from "@/lib/types";

const DECISION_LABEL: Record<RefundDecision, string> = {
  full_refund: "Full refund",
  partial_refund: "Partial refund",
  deny: "Deny",
};

const DECISION_VARIANT: Record<RefundDecision, "default" | "secondary" | "destructive"> = {
  full_refund: "default",
  partial_refund: "secondary",
  deny: "destructive",
};

export function ResultsPanel({ result }: { result: TriageResult }) {
  const { decision, narrative, bundle, submission } = result;

  const [finalDecision, setFinalDecision] = useState<RefundDecision>(decision.decision);
  const [finalAmount, setFinalAmount] = useState(
    decision.refundAmount !== null ? String(decision.refundAmount) : "",
  );
  const [overrideReason, setOverrideReason] = useState("");
  const [draftResponse, setDraftResponse] = useState(narrative.draftResponse);
  const [actionState, setActionState] = useState<"idle" | "saving" | "saved">("idle");

  const recommendedAmount = decision.refundAmount;
  const overrode = useMemo(() => {
    if (finalDecision !== decision.decision) return true;
    const finalNum = finalAmount.trim() === "" ? null : Number(finalAmount);
    return finalNum !== recommendedAmount;
  }, [finalDecision, finalAmount, decision.decision, recommendedAmount]);

  async function submitAction() {
    setActionState("saving");
    const input: CaseActionInput = {
      caseId: result.caseId,
      recommendationId: result.recommendationId,
      finalDecision,
      finalRefundAmount: finalDecision === "deny" || finalAmount.trim() === "" ? null : Number(finalAmount),
      overrodeRecommendation: overrode,
      overrideReason: overrode ? overrideReason || null : null,
    };
    await fetch("/api/triage/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setActionState("saved");
  }

  return (
    <div className="space-y-4">
      {decision.safetyEscalation && (
        <Alert variant="destructive">
          <AlertTitle>Safety/Security — escalate to Trust &amp; Safety</AlertTitle>
          <AlertDescription>
            This case requires human escalation regardless of the refund amount below. The figure here is a
            secondary signal, not a resolution of the safety concern.
          </AlertDescription>
        </Alert>
      )}

      {decision.needsManualReview && (
        <Alert>
          <AlertTitle>Needs manual review</AlertTitle>
          <AlertDescription>
            Confidence is {decision.confidence}%, below the 70% threshold — a range is shown instead of a single
            amount. Use your judgment to settle on a final figure.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Recommendation</CardTitle>
          <Badge variant={DECISION_VARIANT[decision.decision]}>{DECISION_LABEL[decision.decision]}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-muted-foreground">Amount</div>
              <div className="font-mono text-base">
                {decision.decision === "deny"
                  ? "—"
                  : decision.needsManualReview
                    ? `$${decision.refundRangeLow} – $${decision.refundRangeHigh}`
                    : `$${decision.refundAmount}`}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Confidence</div>
              <div className="font-mono text-base">{decision.confidence}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Timing</div>
              <div className="font-mono text-base">{decision.factors.timingBucket}</div>
            </div>
          </div>
          <Separator />
          <div>
            <div className="text-muted-foreground text-sm mb-1">Rationale</div>
            <p className="text-sm leading-relaxed">{narrative.rationale}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Field label="Guest" value={bundle.guest.name} />
          <Field label="Host" value={bundle.host.name} />
          <Field label="Listing" value={`${bundle.listing.title} (${bundle.listing.category})`} />
          <Field label="Nights stayed" value={String(bundle.reservation.nightsStayed)} />
          <Field label="Booking value" value={`$${bundle.reservation.bookingValueUsd}`} />
          <Field
            label="Dates"
            value={`${bundle.reservation.checkInDate} → ${bundle.reservation.checkOutDate}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {bundle.chatMessages.length === 0 && <p className="text-muted-foreground">No messages.</p>}
          {bundle.chatMessages.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Badge variant="outline" className="shrink-0">
                {m.senderType}
              </Badge>
              <span className="text-muted-foreground shrink-0 font-mono text-xs">{m.sentAt}</span>
              <span>{m.messageText}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {(bundle.guestHistory.length > 0 || bundle.hostHistory.length > 0 || bundle.otherReviews.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>History &amp; corroboration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {bundle.guestHistory.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1">Guest&apos;s past cases</div>
                <ul className="list-disc pl-5">
                  {bundle.guestHistory.map((c, i) => (
                    <li key={i}>
                      {c.filedAt}: {c.issueCategory} → {c.decision}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bundle.hostHistory.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1">Host&apos;s past cases</div>
                <ul className="list-disc pl-5">
                  {bundle.hostHistory.map((c, i) => (
                    <li key={i}>
                      {c.filedAt}: {c.issueCategory} → {c.decision}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bundle.otherReviews.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1">Other guests&apos; reviews of this listing</div>
                <ul className="list-disc pl-5">
                  {bundle.otherReviews.map((r, i) => (
                    <li key={i}>
                      ({r.rating}/5) {r.reviewText}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Guest-facing response (draft)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={5} value={draftResponse} onChange={(e) => setDraftResponse(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Finalize</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="finalDecision">Final decision</Label>
              <Select value={finalDecision} onValueChange={(v) => setFinalDecision(v as RefundDecision)}>
                <SelectTrigger id="finalDecision" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_refund">Full refund</SelectItem>
                  <SelectItem value="partial_refund">Partial refund</SelectItem>
                  <SelectItem value="deny">Deny</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalAmount">Final refund amount ($)</Label>
              <Input
                id="finalAmount"
                type="number"
                min={0}
                step={0.01}
                disabled={finalDecision === "deny"}
                value={finalDecision === "deny" ? "" : finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
              />
            </div>
          </div>

          {overrode && (
            <div className="space-y-2">
              <Label htmlFor="overrideReason">Override reason</Label>
              <Textarea
                id="overrideReason"
                rows={2}
                placeholder="Why are you diverging from the recommendation?"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          )}

          <Button onClick={submitAction} disabled={actionState === "saving" || actionState === "saved"}>
            {actionState === "saved" ? "Saved" : actionState === "saving" ? "Saving..." : overrode ? "Save override" : "Confirm recommendation"}
          </Button>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Case {result.caseId} · Recommendation {result.recommendationId} · Issue: {submission.issueCategory}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  );
}
