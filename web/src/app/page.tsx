import { TriageWorkspace } from "@/components/triage/triage-workspace";
import { config } from "@/lib/config";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-[28px] font-bold text-foreground">Guest Refund Triage</h1>
        <p className="text-muted-foreground text-sm">
          Decision support for guest refund complaints.
          {config.useMockData &&
            " Running on mock data — search the booking field by guest name (e.g. Emily, Ryan, Haruto)."}
          {config.useMockLlm && " Rationale/response text is templated (no ANTHROPIC_API_KEY set)."}
        </p>
      </div>
      <TriageWorkspace />
    </main>
  );
}
