import { Shell } from "@/components/Shell";

// `drawer` is a parallel route slot; the intercepting route @drawer/(.)[id]
// renders the slide-out panel over the board, while /tasks/[id] is the full page.
export default function TasksLayout({
  children,
  drawer,
}: {
  children: React.ReactNode;
  drawer: React.ReactNode;
}) {
  return (
    <Shell>
      {children}
      {drawer}
    </Shell>
  );
}
