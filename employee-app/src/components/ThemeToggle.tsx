import { useEffect, useState } from "react";
import { Sun, Moon } from "./icons";

type Theme = "dark" | "light";

function initialTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

// Flips the app between dark and light by setting data-theme on <html>, which
// swaps the CSS variable values in index.css. Choice is persisted.
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("amm-theme", theme);
    } catch {
      /* ignore storage errors */
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="grid h-8 w-8 place-content-center rounded-full text-[var(--fg-2)]"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
