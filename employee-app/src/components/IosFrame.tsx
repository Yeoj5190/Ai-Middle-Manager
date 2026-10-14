import type { ReactNode } from "react";

// A phone-sized bezel so the web app reads like an iOS app on desktop.
// On a real phone (narrow viewport) it goes full-bleed.
export function IosFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black sm:p-6">
      <div
        className="relative overflow-hidden bg-[var(--bg)] text-[var(--fg)] w-full h-[100dvh] sm:h-[844px] sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-black sm:shadow-2xl"
      >
        {/* notch */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-50 hidden h-7 w-36 -translate-x-1/2 rounded-b-2xl bg-black sm:block" />
        {children}
      </div>
    </div>
  );
}
