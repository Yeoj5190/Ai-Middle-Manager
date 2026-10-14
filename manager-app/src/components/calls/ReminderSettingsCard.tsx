"use client";
import { useState, useTransition } from "react";
import { updateReminderSettings } from "@/lib/actions";
import { I } from "@/components/ui";
import type { ReminderSettings } from "@/lib/types";

const hhmm = (t: string) => (t ?? "").slice(0, 5); // 'HH:MM:SS' → 'HH:MM'

export function ReminderSettingsCard({ settings }: { settings: ReminderSettings }) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [quietStart, setQuietStart] = useState(hhmm(settings.quiet_start));
  const [quietEnd, setQuietEnd] = useState(hhmm(settings.quiet_end));
  const [timezone, setTimezone] = useState(settings.timezone);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  function save() {
    setSaved(null);
    startTransition(async () => {
      const res = await updateReminderSettings({
        enabled,
        quiet_start: quietStart + ":00",
        quiet_end: quietEnd + ":00",
        timezone,
      });
      setSaved(res.message);
    });
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span className="eyebrow" style={{ fontSize: 9.5 }}>Call settings</span>
        <span style={{ flex: 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--fg-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Calls {enabled ? "enabled" : "paused"}
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, alignItems: "end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="eyebrow" style={{ fontSize: 8.5 }}>Quiet hours start</span>
          <input className="input" type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="eyebrow" style={{ fontSize: 8.5 }}>Quiet hours end</span>
          <input className="input" type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span className="eyebrow" style={{ fontSize: 8.5 }}>Timezone</span>
          <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </label>
        <button onClick={save} disabled={pending} className="btn btn-sm" style={{ height: 34 }}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>

      <p className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 12, lineHeight: 1.5 }}>
        No calls fire between {quietStart} and {quietEnd} ({timezone}). Reminders due in that window wait until it reopens.
      </p>
      {saved && (
        <div className="chip good fade-up" style={{ height: 22, marginTop: 10 }}><I.check size={11} sw={2.4} /> {saved}</div>
      )}
    </div>
  );
}
