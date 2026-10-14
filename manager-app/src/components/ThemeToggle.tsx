"use client";
import { useEffect, useState } from "react";
import { I } from "@/components/ui";

type Theme = "dark" | "light";

// Reads/writes data-theme on <html> and persists to localStorage. The initial
// value is applied before paint by the inline script in the root layout, so this
// just syncs React state and handles clicks (no flash-of-wrong-theme).
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    setTheme(current);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("amm-theme", t);
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <div style={{ display: "flex", gap: 3, padding: 3, background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
      {(["dark", "light"] as const).map((k) => {
        const Ico = k === "dark" ? I.moon : I.sun;
        const active = theme === k;
        return (
          <button
            key={k}
            onClick={() => apply(k)}
            aria-label={`${k} theme`}
            aria-pressed={active}
            className="btn btn-sm"
            style={{
              height: 26,
              width: 30,
              padding: 0,
              justifyContent: "center",
              border: "none",
              background: active ? "var(--active)" : "transparent",
              color: active ? "var(--fg)" : "var(--fg-3)",
            }}
          >
            <Ico size={14} />
          </button>
        );
      })}
    </div>
  );
}
