import { useCallback, useEffect, useRef, useState } from "react";
import {
  acknowledgeCheckin,
  fetchDueCheckins,
  fetchMe,
  fetchMyBriefing,
  fetchMyTasks,
  markTaskDone,
  reopenTask,
} from "../lib/api";
import { dateStrInTz, shiftDateStr } from "../config";
import type { Briefing, Checkin, Employee, Task } from "../lib/types";
import { Arrow, Phone, Spark, Check, Camera, Bell, LogOut } from "../components/icons";
import { ThemeToggle } from "../components/ThemeToggle";
import { PushControl } from "../components/PushControl";
import { AlarmOverlay } from "../components/AlarmOverlay";
import { startAlarm, stopAlarm } from "../lib/alarm";

const SNOOZE_MS = 5 * 60 * 1000;

const STATUS_COLOR: Record<string, string> = {
  done: "var(--good)",
  overdue: "var(--crit)",
};

function firstName(name?: string) {
  return name?.split(" ")[0] ?? "there";
}

// label for the day shown in the bar ("Today" / "Wed, Jun 11")
function dayLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return "Today";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function Today({
  onCall,
  onQualityCheck,
  onSignOut,
}: {
  onCall: () => void;
  onQualityCheck: (task: Task) => void;
  onSignOut: () => void;
}) {
  const todayStr = dateStrInTz();
  const [me, setMe] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // who + briefing load once
  useEffect(() => {
    (async () => {
      try {
        const [m, b] = await Promise.all([fetchMe(), fetchMyBriefing()]);
        setMe(m);
        setBriefing(b);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, []);

  // tasks reload whenever the selected day changes
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        setTasks(await fetchMyTasks(selectedDate));
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedDate]);

  const done = tasks.filter((t) => t.status === "done").length;
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const isToday = selectedDate === todayStr;
  // keep completed tasks on the list (shown crossed out) instead of hiding them
  const visibleTasks = tasks;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  // tap the checkbox to toggle done ⇄ todo (stays on the list, crossed out when done)
  const onToggleDone = async (task: Task) => {
    const next = task.status === "done" ? "todo" : "done";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    );
    try {
      if (next === "done") await markTaskDone(task.id);
      else await reopenTask(task.id);
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)),
      );
    }
  };

  // ── in-app check-in notifications (poll every 20s) ────────────────────────
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  // the check-in currently ringing as a full-screen alarm (null = silent)
  const [alarm, setAlarm] = useState<Checkin | null>(null);
  // check-in ids we've already rung for this session (so it rings once, not every poll)
  const rungRef = useRef<Set<string>>(new Set());
  // id → timestamp it may ring again after a snooze
  const snoozedRef = useRef<Map<string, number>>(new Map());

  const refreshCheckins = useCallback(async () => {
    try {
      const list = await fetchDueCheckins();
      setCheckins(list);
      // ring the first due check-in we haven't handled (or whose snooze elapsed)
      const now = Date.now();
      const next = list.find((c) => {
        if (!rungRef.current.has(c.id)) return true;
        const snooze = snoozedRef.current.get(c.id);
        return snooze != null && now >= snooze;
      });
      setAlarm((cur) => {
        if (cur || !next) return cur; // don't interrupt an active alarm
        rungRef.current.add(next.id);
        snoozedRef.current.delete(next.id);
        startAlarm();
        return next;
      });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    refreshCheckins();
    const id = setInterval(refreshCheckins, 20000);
    return () => clearInterval(id);
  }, [refreshCheckins]);
  // stop the sound if the alarm screen ever unmounts
  useEffect(() => () => stopAlarm(), []);

  // ── alarm overlay actions ─────────────────────────────────────────────────
  const isTestAlarm = (c: Checkin) => c.id.startsWith("test-");
  const alarmDone = () => {
    if (alarm && !isTestAlarm(alarm)) checkinMarkDone(alarm);
    stopAlarm();
    setAlarm(null);
  };
  const alarmCall = () => {
    const c = alarm;
    stopAlarm();
    setAlarm(null);
    if (c && !isTestAlarm(c)) dismissCheckin(c.id);
    onCall();
  };
  const alarmAcknowledge = () => {
    if (alarm && !isTestAlarm(alarm)) dismissCheckin(alarm.id);
    stopAlarm();
    setAlarm(null);
  };
  const alarmSnooze = () => {
    if (alarm) snoozedRef.current.set(alarm.id, Date.now() + SNOOZE_MS);
    stopAlarm();
    setAlarm(null);
  };
  // trigger a sample alarm so the worker can experience it on demand
  const testAlarm = () => {
    if (alarm) return;
    const sample: Checkin = {
      id: `test-${Date.now()}`,
      kind: "task_checkin",
      task_id: null,
      opens_call: true,
      context: { task_title: "Pool chemical check & log" },
      fire_at: new Date().toISOString(),
    };
    startAlarm();
    setAlarm(sample);
  };

  const dismissCheckin = async (id: string) => {
    setCheckins((prev) => prev.filter((c) => c.id !== id));
    try {
      await acknowledgeCheckin(id);
    } catch {
      /* ignore */
    }
  };
  const checkinMarkDone = (c: Checkin) => {
    if (c.task_id) {
      const tid = c.task_id;
      setTasks((prev) => prev.map((t) => (t.id === tid ? { ...t, status: "done" } : t)));
      markTaskDone(tid).catch(() => {});
    }
    setCheckins((prev) => prev.filter((x) => x.id !== c.id));
  };
  const checkinCall = (c: Checkin) => {
    dismissCheckin(c.id);
    onCall();
  };
  const dismissAllCheckins = async () => {
    const ids = checkins.map((c) => c.id);
    setCheckins([]);
    ids.forEach((id) => acknowledgeCheckin(id).catch(() => {}));
  };
  // actionable check-ins (need a tap) before the "due soon" nudges
  const sortedCheckins = [...checkins].sort(
    (a, b) =>
      (a.kind === "task_reminder" ? 1 : 0) - (b.kind === "task_reminder" ? 1 : 0),
  );

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* app bar with day navigator */}
      <div className="relative z-20 flex h-[54px] flex-none items-center justify-center border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] pt-1 backdrop-blur">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedDate((d) => shiftDateStr(d, -1))}
            aria-label="Previous day"
            className="grid h-7 w-7 place-content-center rounded-full text-[18px] leading-none text-[var(--fg-3)]"
          >
            ‹
          </button>
          <span className="min-w-[88px] text-center text-[15px] font-semibold">
            {dayLabel(selectedDate, todayStr)}
          </span>
          <button
            onClick={() => setSelectedDate((d) => shiftDateStr(d, 1))}
            disabled={selectedDate >= todayStr}
            aria-label="Next day"
            className="grid h-7 w-7 place-content-center rounded-full text-[18px] leading-none text-[var(--fg-3)] disabled:opacity-25"
          >
            ›
          </button>
        </div>
        <button
          onClick={onSignOut}
          aria-label="Sign out"
          className="absolute left-2.5 grid h-8 w-8 place-content-center rounded-full text-[var(--fg-3)]"
        >
          <LogOut size={16} />
        </button>
        <div className="absolute right-2.5">
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pb-28 pt-[18px]">
        {error && (
          <div className="card mb-4 p-3 text-[13px]" style={{ color: "var(--crit)" }}>
            {error}
          </div>
        )}

        {/* greeting */}
        <div className="mb-[18px]">
          <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
            {me?.shift ? `Shift · ${me.shift}` : " "}
          </div>
          <h2 className="mt-1.5 text-[26px] tracking-tight">
            {loading ? "…" : `Morning, ${firstName(me?.name)}.`}
          </h2>
        </div>

        {/* check-in notifications (cap to the top 2 to avoid a wall) */}
        {checkins.length > 0 && (
          <div className="mb-4 flex flex-col gap-2.5">
            {sortedCheckins.slice(0, 2).map((c) => (
              <CheckinCard
                key={c.id}
                c={c}
                onDone={() => checkinMarkDone(c)}
                onCall={() => checkinCall(c)}
                onDismiss={() => dismissCheckin(c.id)}
              />
            ))}
            {checkins.length > 2 && (
              <button
                onClick={dismissAllCheckins}
                className="rounded-[12px] border border-[var(--border-2)] py-2 text-[12.5px]"
                style={{ color: "var(--fg-3)" }}
              >
                + {checkins.length - 2} more check-in
                {checkins.length - 2 === 1 ? "" : "s"} · Clear all
              </button>
            )}
          </div>
        )}

        {/* AI briefing */}
        <div className="card mb-4 p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="grid h-[22px] w-[22px] place-content-center rounded-[7px] bg-[var(--fg)] text-[var(--bg)]">
              <Spark size={13} />
            </div>
            <span className="eyebrow text-[10px]">From your AI Manager</span>
          </div>
          <p className="m-0 text-[14px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
            {loading
              ? "Loading…"
              : !isToday
                ? `${done} of ${tasks.length} task${tasks.length === 1 ? "" : "s"} completed on this day.`
                : activeTasks.length === 0 && tasks.length > 0
                  ? "Nice work — you're all caught up for now. 🎉"
                  : (briefing?.body ??
                    `You have ${activeTasks.length} task${activeTasks.length === 1 ? "" : "s"} left today.`)}
          </p>
        </div>

        {/* call button */}
        <button
          onClick={onCall}
          className="mb-[22px] flex w-full items-center gap-3 rounded-[14px] border border-[var(--border-2)] bg-[var(--fg)] px-[18px] py-[15px] text-[var(--bg)]"
        >
          <div className="grid h-[38px] w-[38px] flex-none place-content-center rounded-full bg-[color-mix(in_oklab,var(--bg)_14%,transparent)]">
            <Phone size={18} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[14.5px] font-semibold">Call the AI Manager</div>
            <div className="text-[11.5px] opacity-70">Ask anything · always available</div>
          </div>
          <Arrow size={18} />
        </button>

        {/* tasks */}
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow text-[10px]">
            Your tasks · {done}/{tasks.length} done
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {visibleTasks.length === 0 && !loading && (
            <div className="card p-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
              {tasks.length === 0
                ? "No tasks for this day."
                : "All caught up — nothing left for now. 🎉"}
            </div>
          )}
          {visibleTasks.map((t) => (
            <MiniTask
              key={t.id}
              t={t}
              onQualityCheck={onQualityCheck}
              onToggleDone={onToggleDone}
            />
          ))}
        </div>

        {/* today's progress */}
        <div className="mt-[18px]">
          <div className="card p-3.5">
            <div className="flex items-baseline justify-between">
              <div className="font-mono tnum text-[24px] font-semibold">
                {done}
                <span className="text-[15px] text-[var(--fg-3)]">/{tasks.length}</span>
              </div>
              <div className="font-mono tnum text-[12px] text-[var(--fg-3)]">{pct}%</div>
            </div>
            <div className="eyebrow mt-1 text-[9px]">
              {isToday ? "Done today" : "Done this day"}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%`, background: "var(--good)" }}
              />
            </div>
          </div>
          <PushControl onTestAlarm={testAlarm} />
        </div>
      </div>

      {alarm && (
        <AlarmOverlay
          c={alarm}
          onDone={alarmDone}
          onCall={alarmCall}
          onAcknowledge={alarmAcknowledge}
          onSnooze={alarmSnooze}
        />
      )}
    </div>
  );
}

function CheckinCard({
  c,
  onDone,
  onCall,
  onDismiss,
}: {
  c: Checkin;
  onDone: () => void;
  onCall: () => void;
  onDismiss: () => void;
}) {
  const title = c.context?.task_title ?? "your tasks";
  const isReminder = c.kind === "task_reminder";
  const message = isReminder
    ? `Heads up — ${title} is due soon.`
    : c.kind === "daily_checkin"
      ? "Time for your shift check-in with the AI Manager."
      : `Did you get "${title}" done?`;
  return (
    <div className="card p-3.5" style={{ borderColor: "var(--warn)" }}>
      <div className="mb-1.5 flex items-center gap-2">
        <div
          className="grid h-[22px] w-[22px] place-content-center rounded-[7px]"
          style={{ background: "var(--warn)", color: "var(--bg)" }}
        >
          <Bell size={13} />
        </div>
        <span className="eyebrow text-[10px]">AI Manager · check-in</span>
      </div>
      <p className="m-0 mb-2.5 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
        {message}
      </p>
      <div className="flex gap-2">
        {!isReminder && c.task_id && (
          <button
            onClick={onDone}
            className="flex-1 rounded-[10px] py-2 text-[12.5px] font-semibold text-[var(--bg)]"
            style={{ background: "var(--good)" }}
          >
            Mark done
          </button>
        )}
        {c.opens_call && (
          <button
            onClick={onCall}
            className="flex-1 rounded-[10px] bg-[var(--fg)] py-2 text-[12.5px] font-semibold text-[var(--bg)]"
          >
            Call AI
          </button>
        )}
        <button
          onClick={onDismiss}
          className="rounded-[10px] border border-[var(--border-2)] px-3 py-2 text-[12.5px]"
          style={{ color: "var(--fg-3)" }}
        >
          {isReminder ? "Got it" : "Not yet"}
        </button>
      </div>
    </div>
  );
}

function MiniTask({
  t,
  onQualityCheck,
  onToggleDone,
}: {
  t: Task;
  onQualityCheck: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}) {
  const isDone = t.status === "done";
  const dot =
    STATUS_COLOR[t.status] ?? (t.priority === "high" ? "var(--warn)" : "var(--fg-3)");
  return (
    <div className="card flex items-center gap-3 bg-[var(--surface)] px-3.5 py-3">
      <button
        onClick={() => onToggleDone(t)}
        aria-label={`Mark ${t.title} done`}
        className="grid h-5 w-5 flex-none place-content-center rounded-md text-[var(--bg)] active:scale-90 transition-transform"
        style={{
          border: `1.5px solid ${isDone ? "var(--good)" : "var(--border-strong)"}`,
          background: isDone ? "var(--good)" : "transparent",
        }}
      >
        {isDone && <Check size={13} />}
      </button>
      <div className="flex-1">
        <div
          className="text-[13.5px]"
          style={{
            color: isDone ? "var(--fg-3)" : "var(--fg)",
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {t.title}
        </div>
        <div className="font-mono text-[10.5px]" style={{ color: "var(--fg-4)" }}>
          {t.id} · {t.due_label ?? t.status}
        </div>
      </div>
      {t.sop_id ? (
        <button
          onClick={() => onQualityCheck(t)}
          className="grid h-8 w-8 flex-none place-content-center rounded-full border border-[var(--border-2)] text-[var(--fg-2)]"
          aria-label="Quality check"
        >
          <Camera size={16} />
        </button>
      ) : (
        <span
          className="h-2 w-2 flex-none rounded-full"
          style={{ background: dot }}
          aria-hidden
        />
      )}
    </div>
  );
}
