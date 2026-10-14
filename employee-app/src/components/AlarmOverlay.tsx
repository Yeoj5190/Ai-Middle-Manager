import type { Checkin } from "../lib/types";
import { Bell, Phone, Check } from "./icons";

// Full-screen alarm shown when a check-in fires. Rings (via lib/alarm) until the
// worker taps an action. This is the "loud" part of the hybrid alarm — it only
// runs while the app is open/foreground (browser limitation on iOS).
export function AlarmOverlay({
  c,
  onDone,
  onCall,
  onAcknowledge,
  onSnooze,
}: {
  c: Checkin;
  onDone: () => void;
  onCall: () => void;
  onAcknowledge: () => void;
  onSnooze: () => void;
}) {
  const title = c.context?.task_title ?? "your tasks";
  const message =
    c.kind === "task_reminder"
      ? `${title} is due soon.`
      : c.kind === "daily_checkin"
        ? "Time for your shift check-in with the AI Manager."
        : `Time to check in — did you get "${title}" done?`;
  const time = new Date(c.fire_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center px-7 text-center"
      style={{
        background: "color-mix(in oklab, var(--warn) 16%, var(--bg))",
        paddingTop: "calc(env(safe-area-inset-top) + 12px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
      }}
    >
      <span
        className="absolute top-[18px] eyebrow text-[10px]"
        style={{ color: "var(--warn)" }}
      >
        AI Manager · alarm
      </span>

      <div
        className="grid h-24 w-24 place-content-center rounded-full text-[var(--bg)]"
        style={{ background: "var(--warn)", animation: "amm-alarm-pulse 1s ease-in-out infinite" }}
      >
        <Bell size={46} />
      </div>

      <h2 className="mt-8 text-[24px] leading-snug tracking-tight">{message}</h2>
      <p className="mt-2 font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
        Scheduled · {time}
      </p>

      <div className="mt-9 flex w-full max-w-[300px] flex-col gap-2.5">
        {c.kind === "task_checkin" && c.task_id && (
          <button
            onClick={onDone}
            className="flex items-center justify-center gap-2 rounded-[12px] py-3 text-[14px] font-semibold text-[var(--bg)]"
            style={{ background: "var(--good)" }}
          >
            <Check size={17} /> Mark done
          </button>
        )}
        {c.opens_call && (
          <button
            onClick={onCall}
            className="flex items-center justify-center gap-2 rounded-[12px] bg-[var(--fg)] py-3 text-[14px] font-semibold text-[var(--bg)]"
          >
            <Phone size={17} /> Call the AI Manager
          </button>
        )}
        <button
          onClick={onAcknowledge}
          className="rounded-[12px] border border-[var(--border-2)] bg-[var(--surface)] py-3 text-[13.5px] font-semibold"
        >
          I'm on it — stop alarm
        </button>
        <button
          onClick={onSnooze}
          className="py-1 text-[12.5px]"
          style={{ color: "var(--fg-3)" }}
        >
          Snooze 5 min
        </button>
      </div>
    </div>
  );
}
