"use client";
import { useState, useTransition } from "react";
import { runTaskAction } from "@/lib/actions";
import { I } from "@/components/ui";
import type { TaskActionType } from "@/lib/types";

const ACTIONS: { type: TaskActionType; label: string; icon: keyof typeof I; primary?: boolean }[] = [
  { type: "reassign", label: "Reassign", icon: "users" },
  { type: "escalate", label: "Escalate", icon: "spark" },
  { type: "approve_override", label: "Approve override", icon: "check", primary: true },
  { type: "ai_follow_up", label: "Trigger AI follow-up", icon: "replay" },
  { type: "retraining", label: "Schedule retraining", icon: "video" },
  { type: "verification_call", label: "Start AI verification call", icon: "mic" },
];

export function TaskActions({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<TaskActionType | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState("");

  function fire(type: TaskActionType, payload?: string) {
    setBusy(type);
    setStatus(null);
    startTransition(async () => {
      const res = await runTaskAction(taskId, type, payload);
      setStatus(res.message);
      setBusy(null);
      if (type === "note") setNote("");
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {ACTIONS.map((a) => {
          const Icon = I[a.icon];
          return (
            <button
              key={a.type}
              onClick={() => fire(a.type)}
              disabled={pending}
              className={"btn btn-sm" + (a.primary ? " btn-primary" : "")}
            >
              <Icon size={13} />
              {pending && busy === a.type ? "Working…" : a.label}
            </button>
          );
        })}
      </div>

      {/* add note */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim()) fire("note", note.trim());
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note to the audit trail…"
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={pending || !note.trim()} className="btn btn-sm">
          <I.send size={13} /> Add note
        </button>
      </form>

      {status && (
        <div className="chip good fade-up" style={{ height: "auto", padding: "7px 11px", alignSelf: "flex-start", whiteSpace: "normal", lineHeight: 1.4 }}>
          <I.check size={12} sw={2.4} /> {status}
        </div>
      )}
    </div>
  );
}
