"use client";
import { useTransition } from "react";
import { cancelReminder } from "@/lib/actions";

export function CancelReminderButton({ reminderId }: { reminderId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => cancelReminder(reminderId).then(() => {}))}
      disabled={pending}
      className="btn btn-sm btn-ghost"
      style={{ color: "var(--fg-3)" }}
    >
      {pending ? "…" : "Cancel"}
    </button>
  );
}
