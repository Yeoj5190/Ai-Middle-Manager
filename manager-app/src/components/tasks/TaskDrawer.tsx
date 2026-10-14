"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/ui";

// Slide-out panel for the intercepted /tasks/[id] route (Linear/Notion feel).
// Closing returns to the board (router.back); "Open full page" does a hard nav
// to the un-intercepted full-page view.
export function TaskDrawer({ id, children }: { id: string; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const r = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(r);
  }, []);

  function close() {
    setOpen(false);
    setTimeout(() => router.back(), 180);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      {/* backdrop */}
      <div
        onClick={close}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.45)",
          opacity: open ? 1 : 0,
          transition: "opacity .2s var(--ease)",
        }}
      />
      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(560px, 100vw)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .22s var(--ease)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", height: 52, borderBottom: "1px solid var(--border)", background: "color-mix(in oklab, var(--bg) 82%, transparent)", backdropFilter: "blur(10px)" }}>
          <span className="eyebrow" style={{ fontSize: 9.5 }}>Task detail</span>
          <span style={{ flex: 1 }} />
          <a href={`/tasks/${id}`} className="btn btn-sm btn-ghost" style={{ color: "var(--fg-2)" }} title="Open full page">
            <I.arrow size={14} /> Full page
          </a>
          <button onClick={close} className="btn btn-icon btn-sm btn-ghost" aria-label="Close" style={{ color: "var(--fg-2)" }}>
            <I.close size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 20px 48px" }}>{children}</div>
      </div>
    </div>
  );
}
