"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { AnalyzeRequestBody, IssueCategory, ModelId, ReservationSummary, TriagePriority } from "@/lib/types";
import { DEFAULT_MODEL, MODEL_OPTIONS } from "@/lib/config";

function formatDateRange(checkInDate: string, checkOutDate: string) {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(checkInDate)} → ${fmt(checkOutDate)}`;
}

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
  onSubmit: (request: AnalyzeRequestBody) => void;
  isSubmitting: boolean;
}) {
  const [bookingId, setBookingId] = useState("");
  const [issueCategory, setIssueCategory] = useState<IssueCategory | "">("");
  const [evidenceOfClaim, setEvidenceOfClaim] = useState("");
  const [hostResponseTimeHrs, setHostResponseTimeHrs] = useState("");
  const [triagePriority, setTriagePriority] = useState<TriagePriority | "">("");
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);

  useEffect(() => {
    fetch("/api/triage/reservations")
      .then((res) => (res.ok ? res.json() : []))
      .then(setReservations)
      .catch(() => setReservations([]));
  }, []);

  const reservationById = useMemo(() => new Map(reservations.map((r) => [r.bookingId, r])), [reservations]);
  const bookingIds = useMemo(() => reservations.map((r) => r.bookingId), [reservations]);

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
          <Label htmlFor="bookingId">Booking</Label>
          <Combobox
            items={bookingIds}
            value={bookingId || null}
            onValueChange={(id) => setBookingId(id ?? "")}
            itemToStringLabel={(id) => {
              const r = reservationById.get(id);
              return r ? `${r.guestName} — ${r.listingTitle}` : id;
            }}
            filter={(id, query) => {
              const r = reservationById.get(id);
              if (!r) return false;
              const haystack = `${r.guestName} ${r.listingTitle} ${id}`.toLowerCase();
              return haystack.includes(query.trim().toLowerCase());
            }}
          >
            <ComboboxInput id="bookingId" placeholder="Search by guest name or listing…" showClear />
            <ComboboxContent>
              <ComboboxEmpty>No matching reservations.</ComboboxEmpty>
              <ComboboxList>
                {(id: string) => {
                  const r = reservationById.get(id);
                  if (!r) return null;
                  return (
                    <ComboboxItem key={id} value={id}>
                      <div className="flex flex-col gap-0.5 py-0.5">
                        <span className="font-medium">{r.guestName}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.listingTitle} · {formatDateRange(r.checkInDate, r.checkOutDate)}
                        </span>
                      </div>
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
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

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
            <SelectTrigger id="model" className="w-full">
              <SelectValue>
                {(v: ModelId) => MODEL_OPTIONS.find((m) => m.id === v)?.label ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
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
              model,
            })
          }
        >
          {isSubmitting ? "Analyzing..." : "Analyze complaint"}
        </Button>
      </CardContent>
    </Card>
  );
}
