import { useState } from "react";
import { supabase } from "../lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // on success, App's onAuthStateChange takes over and shows the app
  };

  const field =
    "rounded-[12px] border border-[var(--border-2)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-4)]";

  return (
    <div className="absolute inset-0 flex flex-col justify-center px-7">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-content-center rounded-2xl bg-[var(--fg)] text-[22px] font-bold text-[var(--bg)]">
          AI
        </div>
        <h1 className="text-[22px] font-semibold">AI Operations Manager</h1>
        <p className="mt-1 text-[13px] text-[var(--fg-3)]">Sign in to start your shift</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
        {error && (
          <div className="text-[12.5px]" style={{ color: "var(--crit)" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy || !email || !password}
          className="mt-1 rounded-[12px] bg-[var(--fg)] py-3 text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
