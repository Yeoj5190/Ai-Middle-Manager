import { useEffect, useState } from "react";
import { IosFrame } from "./components/IosFrame";
import { Today } from "./screens/Today";
import { Call } from "./screens/Call";
import { QualityCheck } from "./screens/QualityCheck";
import { Login } from "./screens/Login";
import { supabaseConfigured } from "./config";
import { supabase } from "./lib/supabase";
import { setCurrentEmployeeId } from "./lib/session";
import { fetchEmployeeForAuthUser } from "./lib/api";
import { initAlarmPriming } from "./lib/alarm";
import type { Task } from "./lib/types";

type Route = "today" | "call" | "quality";
type AuthStatus = "loading" | "out" | "in";

export default function App() {
  const [route, setRoute] = useState<Route>("today");
  const [qcTask, setQcTask] = useState<Task | null>(null);
  const [auth, setAuth] = useState<AuthStatus>("loading");

  // unlock the alarm audio engine on the first user gesture (iOS requirement)
  useEffect(() => initAlarmPriming(), []);

  useEffect(() => {
    let active = true;
    // map a signed-in auth user → their employee identity, then open the app
    const resolve = async (userId: string) => {
      try {
        const emp = await fetchEmployeeForAuthUser(userId);
        if (!active) return;
        if (emp) {
          setCurrentEmployeeId(emp.id);
          setAuth("in");
        } else {
          // signed in but not linked to a worker — bounce back to login
          await supabase.auth.signOut();
          setAuth("out");
        }
      } catch {
        if (active) setAuth("out");
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) resolve(data.session.user.id);
      else setAuth("out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) resolve(session.user.id);
      else setAuth("out");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setRoute("today");
    await supabase.auth.signOut();
  };

  if (!supabaseConfigured) {
    return (
      <IosFrame>
        <div className="absolute inset-0 grid place-content-center px-8 text-center text-[13px] text-[var(--fg-3)]">
          Supabase not configured. Copy <code>.env.example</code> → <code>.env.local</code>{" "}
          and fill in the URL + anon key.
        </div>
      </IosFrame>
    );
  }
  if (auth === "loading") {
    return (
      <IosFrame>
        <div className="absolute inset-0 grid place-content-center text-[13px] text-[var(--fg-3)]">
          Loading…
        </div>
      </IosFrame>
    );
  }
  if (auth === "out") {
    return (
      <IosFrame>
        <Login />
      </IosFrame>
    );
  }

  return (
    <IosFrame>
      {route === "today" && (
        <Today
          onCall={() => setRoute("call")}
          onQualityCheck={(t) => {
            setQcTask(t);
            setRoute("quality");
          }}
          onSignOut={signOut}
        />
      )}
      {route === "call" && <Call onClose={() => setRoute("today")} />}
      {route === "quality" && (
        <QualityCheck task={qcTask} onClose={() => setRoute("today")} />
      )}
    </IosFrame>
  );
}
