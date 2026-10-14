"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Nav groups mirror the desktop sidebar (README §8.1). Overview + Employees are
// wired; the rest are shown disabled for context.
const NAV = [
  { label: "Overview", href: "/overview", enabled: true },
  { label: "Escalations", href: "/escalations", enabled: true },
  { label: "Tasks", href: "/tasks", enabled: true },
  { label: "Employees", href: "/employees", enabled: true },
  { label: "Verification", href: "/verification", enabled: true },
  { label: "Calls", href: "/calls", enabled: true },
  { label: "Analytics", href: "/analytics", enabled: true },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8 }}>
      {NAV.map((n) => {
        const active = n.enabled && (pathname === n.href || pathname.startsWith(n.href + "/"));
        if (!n.enabled) {
          return (
            <span
              key={n.label}
              className="btn btn-sm btn-ghost"
              style={{ color: "var(--fg-4)", cursor: "default" }}
              title="Not in this build"
            >
              {n.label}
            </span>
          );
        }
        return (
          <Link
            key={n.label}
            href={n.href}
            className="btn btn-sm btn-ghost"
            style={{ color: active ? "var(--fg)" : "var(--fg-3)", background: active ? "var(--active)" : "transparent" }}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
