"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentSubmission, IssueCategory, TriagePriority } from "@/lib/types";

const ISSUE_CATEGORIES: IssueCategory[] = [
  "Safety/Security",
  "Amenities Missing",
  "Inaccurate Listing",
  "Cleanliness",
  "Host Responsiveness",
];
const TRIAGE_PRIORITIES: TriagePriority[] = ["High", "Medium", "Low"];

export function ComplaintForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (submission: AgentSubmission) => void;
  isSubmitting: boolean;
}) {
  const [bookingId, setBookingId] = useState("");
  const [issueCategory, setIssueCategory] = useState<IssueCategory | "">("");
  const [evidenceOfClaim, setEvidenceOfClaim] = useState("");
  const [hostResponseTimeHrs, setHostResponseTimeHrs] = useState("");
  const [triagePriority, setTriagePriority] = useState<TriagePriority | "">("");

  const canSubmit = bookingId.trim().length > 0 && issueCategory !== "" && triagePriority !== "" && !isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>New complaint</CardTitle>
        <CardDescription>
          Nights stayed and booking value are pulled from the reservation automatically — no need to enter them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bookingId">Booking / reservation ID</Label>
          <Input
            id="bookingId"
            placeholder="e.g. EMILY-750"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issueCategory">Issue category</Label>
          <Select value={issueCategory} onValueChange={(v) => setIssueCategory(v as IssueCategory)}>
            <SelectTrigger id="issueCategory" className="w-full">
              <SelectValue placeholder="Select an issue category" />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="evidence">Evidence of claim (optional)</Label>
          <Textarea
            id="evidence"
            placeholder="Summarize what the guest provided (photos, description, etc.)"
            value={evidenceOfClaim}
            onChange={(e) => setEvidenceOfClaim(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hostResponseTime">Host response time, hours (optional)</Label>
          <Input
            id="hostResponseTime"
            type="number"
            min={0}
            step={0.25}
            placeholder="e.g. 2"
            value={hostResponseTimeHrs}
            onChange={(e) => setHostResponseTimeHrs(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="triagePriority">Triage priority</Label>
          <Select value={triagePriority} onValueChange={(v) => setTriagePriority(v as TriagePriority)}>
            <SelectTrigger id="triagePriority" className="w-full">
              <SelectValue placeholder="Select a priority" />
            </SelectTrigger>
            <SelectContent>
              {TRIAGE_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              bookingId: bookingId.trim(),
              issueCategory: issueCategory as IssueCategory,
              evidenceOfClaim,
              hostResponseTimeHrs: hostResponseTimeHrs.trim() === "" ? null : Number(hostResponseTimeHrs),
              triagePriority: triagePriority as TriagePriority,
            })
          }
        >
          {isSubmitting ? "Analyzing..." : "Analyze complaint"}
        </Button>
      </CardContent>
    </Card>
  );
}
