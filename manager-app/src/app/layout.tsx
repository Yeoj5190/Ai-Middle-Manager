import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Middle Manager — Manager",
  description: "Supervise frontline teams through an AI operations manager.",
};

// Applied before paint so there's no flash of the wrong theme on load.
// Defaults to dark (matches the :root palette in globals.css).
const themeScript = `(function(){try{var t=localStorage.getItem('amm-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
