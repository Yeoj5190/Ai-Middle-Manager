"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/env";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    if (supabaseConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="btn btn-sm btn-ghost"
      style={{ color: "var(--fg-3)" }}
      title="Sign out"
    >
      Sign out
    </button>
  );
}
