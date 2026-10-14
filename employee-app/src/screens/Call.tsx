import { useEffect, useMemo, useRef, useState } from "react";
import { useRealtimeCall, type ToolHandlers } from "../realtime/useRealtimeCall";
import {
  analyzePhoto,
  createReportedTask,
  fetchMe,
  fetchMyTasks,
  saveQualityCheck,
} from "../lib/api";
import { Waveform } from "../components/Waveform";
import { Mic, MicOff, Camera, PhoneOff } from "../components/icons";

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function Call({ onClose }: { onClose: () => void }) {
  // tools the AI can invoke mid-call. get_my_tasks reads the worker's real tasks
  // from Supabase and hands them back so the AI answers from data, not guesses.
  const tools = useMemo<ToolHandlers>(
    () => ({
      get_my_tasks: async () => {
        const all = await fetchMyTasks();
        const active = all.filter((t) => t.status !== "done");
        return {
          pending_count: active.length,
          done_count: all.length - active.length,
          tasks: active.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            due: t.due_label,
          })),
        };
      },
      // worker reports a problem/shortage on the call → log it as a new task
      report_issue: async (args) => {
        const title = String(args.title ?? "").trim();
        if (!title) return { created: false, error: "no title provided" };
        const urgency = (["high", "med", "low"] as const).includes(
          args.urgency as "high" | "med" | "low",
        )
          ? (args.urgency as "high" | "med" | "low")
          : "med";
        try {
          const t = await createReportedTask(
            title,
            args.details ? String(args.details) : undefined,
            urgency,
          );
          setPhotoStatus(`📝 Logged task: ${t.title}`);
          return { created: true, task_id: t.id, title: t.title };
        } catch (e: any) {
          return { created: false, error: e?.message ?? String(e) };
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const call = useRealtimeCall(tools);
  const live = call.status === "live";
  const timer = useTimer(live);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  const greetedRef = useRef(false);

  // auto-connect on mount
  useEffect(() => {
    call.start();
    return () => call.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the moment the call is ready, hand the AI the worker's real context and have
  // it OPEN the conversation like a manager — greet, remind of tasks, ask for photos.
  useEffect(() => {
    if (!call.ready || greetedRef.current) return;
    greetedRef.current = true;
    (async () => {
      try {
        const [me, all] = await Promise.all([fetchMe(), fetchMyTasks()]);
        const name = me?.name?.split(" ")[0] ?? "there";
        const active = all.filter((t) => t.status !== "done");
        if (active.length === 0) {
          call.respondWith(
            `Open the shift check-in now. Greet ${name} warmly by first name and tell them ` +
              `they've cleared all their tasks for now — nice work — and you're here if anything ` +
              `comes up. One or two short sentences. Greet only once.`,
          );
        } else {
          const taskList = active
            .map((t) => `${t.title} (${t.due_label ?? t.status})`)
            .join("; ");
          call.respondWith(
            `Open the shift check-in now. Greet ${name} warmly by first name. ` +
              `Their remaining tasks today: ${taskList}. ` +
              `Remind them of these and any deadlines, suggest where to start, and tell them to ` +
              `tap the Camera to send a photo when they finish each task. ` +
              `2-3 short sentences. Greet only once.`,
          );
        }
      } catch {
        call.respondWith(
          `Open the shift check-in now: greet the worker warmly, offer to run through their ` +
            `tasks, and remind them you can check their work from a photo. One short greeting only.`,
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.ready]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [call.transcript]);

  const statusLabel =
    call.status === "connecting"
      ? "Connecting…"
      : call.status === "live"
        ? timer
        : call.status === "error"
          ? "Couldn't connect"
          : call.status === "ended"
            ? "Call ended"
            : "";

  const hangUp = () => {
    call.end();
    onClose();
  };

  // Camera mid-call: snap a photo → score it against the worker's SOP → feed the
  // result back into the live call so the AI talks them through pass/fail.
  const onPhotoPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setScoring(true);
    setPhotoStatus("Checking photo…");
    try {
      // GENERAL inspection: the AI identifies the area from the photo (room, lobby,
      // pool, hallway…) and assesses THAT — not a fixed bed/room checklist.
      const result = await analyzePhoto(image);
      await saveQualityCheck(null, null, result);

      const area = result.area && result.area !== "unknown" ? result.area : "the area";
      const fails = result.results.filter((r) => !r.pass);
      setPhotoStatus(
        `${area}: ${result.overall} · ${result.score}/100` +
          (fails.length ? ` — fix: ${fails.map((f) => f.label).join(", ")}` : " ✓"),
      );

      // hand the structured result to the AI so it responds out loud
      const items = result.results
        .map((r) => `${r.label}: ${r.pass ? "PASS" : "FAIL — " + r.reason}`)
        .join("; ");
      call.sendContext(
        `(System note: the worker submitted a photo of ${area}. What is visible: ${result.photo_summary ?? area}. ` +
          `Quality check — overall ${result.overall}, score ${result.score}/100. Items: ${items}. ` +
          `Reply by FIRST telling them in one sentence what you can see in their photo, THEN give the result and how to fix any fails. Keep it short.)`,
      );
    } catch (err: any) {
      setPhotoStatus(
        err?.message ? `Couldn't score photo: ${err.message}` : "Couldn't score photo.",
      );
    } finally {
      setScoring(false);
    }
  };

  return (
    <div
      className="absolute inset-0 flex flex-col bg-[var(--bg)]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* header */}
      <div className="flex flex-col items-center pt-16">
        <div className="grid h-20 w-20 place-content-center rounded-full bg-[var(--surface)] text-[28px] font-semibold">
          AI
        </div>
        <div className="mt-4 text-[19px] font-semibold">AI Operations Manager</div>
        <div
          className="mt-1 font-mono text-[13px] tnum"
          style={{ color: call.status === "error" ? "var(--crit)" : "var(--fg-3)" }}
        >
          {statusLabel}
        </div>
      </div>

      {call.error && (
        <div className="mx-5 mt-3 card p-3 text-[12px]" style={{ color: "var(--crit)" }}>
          {call.error}
        </div>
      )}

      {/* waveform */}
      <div className="px-8 pt-6">
        <Waveform analyser={call.analyser} />
      </div>

      {/* live transcript */}
      <div ref={scrollRef} className="mt-2 flex-1 overflow-y-auto px-5">
        <div className="flex flex-col gap-2.5 pb-4">
          {call.transcript.length === 0 && live && (
            <div className="text-center text-[12px]" style={{ color: "var(--fg-4)" }}>
              Your manager is starting the check-in…
            </div>
          )}
          {call.transcript
            .filter((l) => l.text.trim().length > 0)
            .map((l) => (
            <div
              key={l.id}
              className="max-w-[80%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug"
              style={{
                alignSelf: l.who === "me" ? "flex-end" : "flex-start",
                background: l.who === "me" ? "var(--fg)" : "var(--card)",
                color: l.who === "me" ? "var(--bg)" : "var(--fg-2)",
                border: l.who === "me" ? "none" : "1px solid var(--border)",
                opacity: l.done ? 1 : 0.75,
              }}
            >
              {l.text}
            </div>
          ))}
        </div>
      </div>

      {/* photo QC status */}
      {photoStatus && (
        <div
          className="mx-5 mb-2 card p-2.5 text-center text-[12px]"
          style={{ color: "var(--fg-2)" }}
        >
          {photoStatus}
        </div>
      )}

      {/* controls */}
      <div className="flex items-center justify-center gap-6 pb-12 pt-4">
        <CtrlButton
          label={call.muted ? "Unmute" : "Mute"}
          onClick={call.toggleMute}
          active={call.muted}
        >
          {call.muted ? <MicOff size={22} /> : <Mic size={22} />}
        </CtrlButton>
        <button
          onClick={hangUp}
          className="grid h-[68px] w-[68px] place-content-center rounded-full bg-[var(--crit)] text-white shadow-lg"
          aria-label="End call"
        >
          <PhoneOff size={26} />
        </button>
        <CtrlButton
          label={scoring ? "Scoring…" : "Camera"}
          onClick={() => fileRef.current?.click()}
          disabled={!live || scoring}
        >
          <Camera size={22} />
        </CtrlButton>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoPicked}
        className="hidden"
      />
    </div>
  );
}

function CtrlButton({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        disabled={disabled}
        className="grid h-14 w-14 place-content-center rounded-full border border-[var(--border-2)] disabled:opacity-40"
        style={{
          background: active ? "var(--fg)" : "var(--surface)",
          color: active ? "var(--bg)" : "var(--fg)",
        }}
      >
        {children}
      </button>
      <span className="font-mono text-[10px]" style={{ color: "var(--fg-4)" }}>
        {label}
      </span>
    </div>
  );
}
