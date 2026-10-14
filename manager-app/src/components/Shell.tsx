import Link from "next/link";
import { Av, I } from "@/components/ui";
import { getCurrentUser } from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";
import { SignOutButton } from "@/components/SignOutButton";
import { NavLinks } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  ops_manager: "Operations Manager",
  supervisor: "Supervisor",
  trainer: "Trainer",
  admin: "Admin",
};

export async function Shell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 20px",
          height: 56,
          background: "color-mix(in oklab, var(--bg) 82%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/overview" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--fg)" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}>
            <I.logo size={17} />
          </span>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-3)", letterSpacing: ".04em", whiteSpace: "nowrap" }}>
            AI MIDDLE MANAGER
          </span>
        </Link>

        <NavLinks />

        <div style={{ flex: 1 }} />

        <ThemeToggle />

        {!supabaseConfigured && (
          <span className="chip warn" style={{ height: 22 }} title="Supabase not configured — using seed data, auth bypassed">
            <span className="dot" /> dev data
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right", lineHeight: 1.2 }}>
            <div style={{ fontSize: 12.5, fontWeight: 540 }}>{user.name}</div>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--fg-3)" }}>
              {ROLE_LABEL[user.role] ?? user.role}
            </div>
          </div>
          <Av initials={initials} size={30} />
          <SignOutButton />
        </div>
      </header>

      <main style={{ flex: 1, width: "min(1180px, 100%)", margin: "0 auto", padding: "28px 24px 64px" }}>
        {children}
      </main>
    </div>
  );
}
