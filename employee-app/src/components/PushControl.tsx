import { useEffect, useState } from "react";
import { enablePush, pushStatus, sendTestPush, type PushStatus } from "../lib/push";
import { Bell, Arrow } from "./icons";

export function PushControl({ onTestAlarm }: { onTestAlarm?: () => void }) {
  const [status, setStatus] = useState<PushStatus>("default");
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [devOpen, setDevOpen] = useState(false);

  useEffect(() => setStatus(pushStatus()), []);

  const enable = async () => {
    setBusy(true);
    setMsg(null);
    const r = await enablePush();
    setBusy(false);
    setStatus(pushStatus());
    setMsg(r.ok ? "Notifications are on for this device." : (r.error ?? "Couldn't enable."));
  };

  // iOS won't pop a banner while the app is in the foreground, so count down to
  // give the worker time to lock the phone before the push actually fires.
  const test = async () => {
    setMsg("Lock your phone or go to the home screen now…");
    for (let n = 5; n > 0; n--) {
      setCountdown(n);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);
    setBusy(true);
    const r = await sendTestPush();
    setBusy(false);
    setMsg(
      r.ok
        ? "Sent — check your lock screen or Notification Center."
        : (r.error ?? "Failed to send."),
    );
  };

  if (status === "unsupported") return null;
  const needsEnable = status !== "granted";

  return (
    <div className="mt-2.5">
      {/* slim enable prompt — only while notifications are off; hides once on */}
      {needsEnable && (
        <button
          onClick={enable}
          disabled={busy}
          className="flex w-full items-center gap-2.5 rounded-[12px] border border-[var(--border-2)] bg-[var(--surface)] px-3.5 py-2.5 text-left disabled:opacity-50"
        >
          <span className="grid h-[26px] w-[26px] flex-none place-content-center rounded-full bg-[var(--fg)] text-[var(--bg)]">
            <Bell size={13} />
          </span>
          <span className="flex-1 text-[13px]">
            {busy ? "Turning on…" : "Turn on shift notifications"}
          </span>
          <Arrow size={15} className="text-[var(--fg-3)]" />
        </button>
      )}

      {/* discreet entry to the testing tools (operator use) */}
      <div className="mt-2 flex justify-center">
        <button
          onClick={() => setDevOpen((v) => !v)}
          className="px-3 py-1 text-[10px] tracking-wide text-[var(--fg-4)]"
        >
          {devOpen ? "Hide diagnostics" : "Diagnostics"}
        </button>
      </div>

      {devOpen && (
        <div className="card mt-1 p-3">
          <div className="flex flex-wrap gap-2">
            {status === "granted" ? (
              <button
                onClick={test}
                disabled={busy || countdown != null}
                className="rounded-[10px] border border-[var(--border-2)] bg-[var(--surface)] px-3.5 py-2 text-[12.5px] disabled:opacity-50"
              >
                {countdown != null
                  ? `Lock your phone… ${countdown}`
                  : busy
                    ? "Sending…"
                    : "Send a test notification"}
              </button>
            ) : (
              <button
                onClick={enable}
                disabled={busy}
                className="rounded-[10px] bg-[var(--fg)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--bg)] disabled:opacity-50"
              >
                {busy ? "Enabling…" : "Enable notifications"}
              </button>
            )}
            {onTestAlarm && (
              <button
                onClick={onTestAlarm}
                className="rounded-[10px] border border-[var(--border-2)] bg-[var(--surface)] px-3.5 py-2 text-[12.5px]"
              >
                Test alarm
              </button>
            )}
          </div>
          {msg && (
            <div className="mt-2 text-[12px]" style={{ color: "var(--fg-3)" }}>
              {msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
