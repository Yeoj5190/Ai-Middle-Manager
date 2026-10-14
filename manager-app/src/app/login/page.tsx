import Link from "next/link";
import { I } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeContent: "center", padding: 24 }}>
      <div style={{ width: "min(380px, 92vw)", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}>
            <I.logo size={19} />
          </span>
          <span className="mono" style={{ fontSize: 12, color: "var(--fg-3)", letterSpacing: ".04em" }}>AI MIDDLE MANAGER</span>
        </div>

        <div>
          <h1 style={{ fontSize: 24 }}>Manager sign-in</h1>
          <p style={{ fontSize: 13.5, color: "var(--fg-2)", marginTop: 8, lineHeight: 1.5 }}>
            Supervise every location, employee and AI verification from one place.
          </p>
        </div>

        {supabaseConfigured ? (
          <LoginForm />
        ) : (
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <span className="chip warn" style={{ height: 22, alignSelf: "flex-start" }}>
              <span className="dot" /> dev data mode
            </span>
            <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5, margin: 0 }}>
              Supabase isn’t configured, so auth is bypassed and data comes from the seed file.
              Add your Supabase keys to <span className="mono">.env.local</span> to enable real sign-in.
            </p>
            <Link href="/overview" className="btn btn-primary" style={{ justifyContent: "center" }}>
              Enter as demo manager <I.arrow size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
