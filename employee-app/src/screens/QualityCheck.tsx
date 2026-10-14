import { useEffect, useRef, useState } from "react";
import { analyzePhoto, fetchSop, saveQualityCheck } from "../lib/api";
import type { QualityResult, Sop, Task } from "../lib/types";
import { Camera, Check, X, Spark } from "../components/icons";

// idle  → tap to open the live camera
// camera → live preview + shutter
// review → captured photo, ready to scan
// analyzing → scan-line animation while the AI looks
// result → what the AI sees + what to improve
type Phase = "idle" | "camera" | "review" | "analyzing" | "result";

const OVERALL: Record<string, { label: string; color: string }> = {
  pass: { label: "Pass", color: "var(--good)" },
  partial: { label: "Needs work", color: "var(--warn)" },
  fail: { label: "Fail", color: "var(--crit)" },
};

const MAX_EDGE = 1280; // downscale captures so vision calls stay fast

export function QualityCheck({
  task,
  onClose,
}: {
  task: Task | null;
  onClose: () => void;
}) {
  const [sop, setSop] = useState<Sop | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<QualityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (task?.sop_id) fetchSop(task.sop_id).then(setSop).catch(() => {});
  }, [task?.sop_id]);

  // attach the live stream once the <video> is on screen
  useEffect(() => {
    if (phase === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => () => stopCamera(), []); // stop on unmount

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      fileRef.current?.click(); // no live camera here → OS picker
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setPhase("camera");
    } catch {
      setError("Couldn't open the camera. Choose a photo instead.");
      fileRef.current?.click();
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, MAX_EDGE / Math.max(v.videoWidth, v.videoHeight));
    const w = Math.round(v.videoWidth * scale);
    const h = Math.round(v.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setPhase("review");
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setResult(null);
      setSaved(false);
      setError(null);
      setPhase("review");
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!photo || !sop) return;
    setPhase("analyzing");
    setError(null);
    try {
      const r = await analyzePhoto(photo, sop.checklist, sop.title);
      setResult(r);
      setPhase("result");
      if (task) {
        await saveQualityCheck(task.id, task.sop_id, r);
        setSaved(true);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setPhase("review");
    }
  };

  const retake = () => {
    setPhoto(null);
    setResult(null);
    setSaved(false);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
    startCamera();
  };

  const improvements = result?.results.filter((r) => !r.pass) ?? [];

  return (
    <div
      className="absolute inset-0 flex flex-col bg-[var(--bg)]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* app bar */}
      <div className="relative z-20 flex h-[54px] flex-none items-center justify-center border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] pt-1 backdrop-blur">
        <button
          onClick={onClose}
          className="absolute left-3 text-[13px] text-[var(--fg-3)]"
        >
          Back
        </button>
        <span className="text-[15px] font-semibold">Quality check</span>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pb-10 pt-4">
        {/* task + SOP context */}
        <div className="mb-3">
          <div className="text-[17px] font-semibold">{task?.title ?? "—"}</div>
          <div className="font-mono text-[11px] text-[var(--fg-3)]">
            {sop ? `SOP · ${sop.title}` : "Loading SOP…"}
          </div>
        </div>

        {error && (
          <div className="card mb-3 p-3 text-[12.5px]" style={{ color: "var(--crit)" }}>
            {error}
          </div>
        )}

        {/* ── live camera ──────────────────────────────────────────────── */}
        {phase === "camera" && (
          <>
            <div className="card relative mb-3 aspect-[3/4] w-full overflow-hidden bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
              />
              {/* viewfinder frame */}
              <div className="pointer-events-none absolute inset-5 rounded-[14px] border-2 border-white/70" />
            </div>
            <button
              onClick={capture}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--fg)] px-4 py-3 text-[14px] font-semibold text-[var(--bg)]"
            >
              <Camera size={16} /> Capture
            </button>
          </>
        )}

        {/* ── idle / review / analyzing photo area ─────────────────────── */}
        {phase !== "camera" && (
          <>
            <div className="card relative mb-3 flex aspect-[3/4] w-full items-center justify-center overflow-hidden">
              {photo ? (
                <img src={photo} alt="work" className="h-full w-full object-cover" />
              ) : (
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-2 text-[var(--fg-3)]"
                >
                  <Camera size={30} />
                  <span className="text-[13px]">Tap to open the camera</span>
                </button>
              )}

              {/* scanning overlay */}
              {phase === "analyzing" && (
                <div className="absolute inset-0 bg-black/30">
                  <div
                    className="absolute left-0 right-0 h-[3px] bg-[var(--good)] shadow-[0_0_14px_3px_var(--good)]"
                    style={{ animation: "amm-scan 1.4s ease-in-out infinite alternate" }}
                  />
                  <div className="absolute inset-x-0 bottom-3 text-center text-[12.5px] font-semibold text-white">
                    Scanning…
                  </div>
                </div>
              )}
            </div>

            {phase === "idle" && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-[12px] border border-[var(--border-2)] bg-[var(--surface)] py-2.5 text-[13px] text-[var(--fg-2)]"
              >
                Choose from library
              </button>
            )}

            {phase === "review" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={retake}
                  className="flex-1 rounded-[14px] border border-[var(--border-2)] bg-[var(--surface)] py-3 text-[13px]"
                >
                  Retake
                </button>
                <button
                  onClick={analyze}
                  disabled={!sop}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-[14px] bg-[var(--fg)] py-3 text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50"
                >
                  <Spark size={16} /> Scan against SOP
                </button>
              </div>
            )}

            {phase === "analyzing" && (
              <div className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--fg)] px-4 py-3 text-[14px] font-semibold text-[var(--bg)] opacity-70">
                Analyzing photo…
              </div>
            )}
          </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPick}
          className="hidden"
        />

        {/* ── result ───────────────────────────────────────────────────── */}
        {phase === "result" && result && (
          <div className="mt-4">
            <div className="card mb-3 flex items-center justify-between p-4">
              <div>
                <div className="eyebrow text-[10px]">Result</div>
                <div
                  className="mt-1 text-[18px] font-semibold"
                  style={{ color: OVERALL[result.overall]?.color }}
                >
                  {OVERALL[result.overall]?.label ?? result.overall}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono tnum text-[26px] font-semibold">
                  {result.score}
                </div>
                <div className="eyebrow text-[9px]">Score</div>
              </div>
            </div>

            {result.photo_summary && (
              <div className="card mb-3 p-3.5">
                <div className="eyebrow mb-1 text-[10px]">
                  What the AI sees
                  {result.area && result.area !== "unknown" ? ` · ${result.area}` : ""}
                </div>
                <p className="m-0 text-[13px]" style={{ color: "var(--fg-2)" }}>
                  {result.photo_summary}
                </p>
              </div>
            )}

            {/* what needs improving — leads with the actionable part */}
            <div
              className="card mb-3 p-3.5"
              style={{
                borderColor:
                  improvements.length === 0 ? "var(--good)" : "var(--warn)",
              }}
            >
              <div className="eyebrow mb-1.5 text-[10px]">
                {improvements.length === 0 ? "Looks good" : "To improve"}
              </div>
              {improvements.length === 0 ? (
                <p className="m-0 text-[13px]" style={{ color: "var(--fg-2)" }}>
                  Nothing to fix — this passes the check. 🎉
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {improvements.map((r) => (
                    <li
                      key={r.key}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: "var(--fg-2)" }}
                    >
                      <span
                        className="mt-[3px] h-1.5 w-1.5 flex-none rounded-full"
                        style={{ background: "var(--warn)" }}
                        aria-hidden
                      />
                      <span>
                        <span className="font-semibold">{r.label}:</span> {r.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* full checklist */}
            <div className="flex flex-col gap-2">
              {result.results.map((r) => (
                <div key={r.key} className="card flex items-start gap-3 p-3">
                  <span
                    className="mt-0.5 grid h-5 w-5 flex-none place-content-center rounded-full text-white"
                    style={{ background: r.pass ? "var(--good)" : "var(--crit)" }}
                  >
                    {r.pass ? <Check size={13} /> : <X size={13} />}
                  </span>
                  <div>
                    <div className="text-[13.5px]">{r.label}</div>
                    <div className="text-[12px] text-[var(--fg-3)]">{r.reason}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={retake}
                className="flex-1 rounded-[12px] border border-[var(--border-2)] bg-[var(--surface)] py-2.5 text-[13px]"
              >
                Retake
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-[12px] bg-[var(--fg)] py-2.5 text-[13px] font-semibold text-[var(--bg)]"
              >
                {saved ? "Saved · Done" : "Done"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
