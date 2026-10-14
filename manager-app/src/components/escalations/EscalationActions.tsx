"use client";
import { useState, useTransition } from "react";
import { setEscalationStatus } from "@/lib/actions";
import { I } from "@/components/ui";
import type { EscalationStatus } from "@/lib/types";

export function EscalationActions({
  escalationId,
  status,
}: {
  escalationId: string;
  status: EscalationStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const resolved = status !== "open";

  function fire(next: Exclude<EscalationStatus, "open">) {
    setMsg(null);
    startTransition(async () => {
      const res = await setEscalationStatus(escalationId, next);
      setMsg(res.message);
    });
  }

  if (resolved && !pending) {
    const label =
      status === "approved" ? "Approved" : status === "reassigned" ? "Reassigned" : "Snoozed";
    return (
      <div className="chip good" style={{ height: 40, width: "100%", justifyContent: "center", boxSizing: "border-box" }}>
        <I.check size={14} sw={2.4} /> {msg ?? `${label} — handled`}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => fire("approved")} disabled={pending} className="btn btn-primary" style={{ flex: 1, height: 44, justifyContent: "center" }}>
          <I.check size={16} sw={2.4} /> {pending ? "Working…" : "Approve action"}
        </button>
        <button onClick={() => fire("reassigned")} disabled={pending} className="btn" style={{ height: 44 }}>
          Reassign
        </button>
        <button onClick={() => fire("snoozed")} disabled={pending} className="btn" style={{ height: 44 }}>
          Snooze
        </button>
      </div>
    </div>
  );
}
