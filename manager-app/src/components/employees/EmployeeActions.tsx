"use client";
import { useState, useTransition } from "react";
import { runEmployeeAction } from "@/lib/actions";
import { I } from "@/components/ui";
import type { ActionType } from "@/lib/types";

interface ActionDef {
  type: ActionType;
  label: string;
  icon: "send" | "replay" | "chat";
  primary?: boolean;
}

export function EmployeeActions({
  employeeId,
  employeeName,
  actions,
}: {
  employeeId: string;
  employeeName: string;
  actions: ActionDef[];
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [busyType, setBusyType] = useState<ActionType | null>(null);

  function fire(type: ActionType) {
    setBusyType(type);
    setStatus(null);
    startTransition(async () => {
      const res = await runEmployeeAction(employeeId, employeeName, type);
      setStatus(res.message);
      setBusyType(null);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {actions.map((a) => {
          const Icon = I[a.icon];
          return (
            <button
              key={a.type}
              onClick={() => fire(a.type)}
              disabled={pending}
              className={"btn btn-sm" + (a.primary ? " btn-primary" : "")}
            >
              <Icon size={13} />
              {pending && busyType === a.type ? "Working…" : a.label}
            </button>
          );
        })}
      </div>
      {status && (
        <div
          className="chip good fade-up"
          style={{ height: "auto", padding: "7px 11px", alignSelf: "flex-start", whiteSpace: "normal", lineHeight: 1.4 }}
        >
          <I.check size={12} sw={2.4} /> {status}
        </div>
      )}
    </div>
  );
}
