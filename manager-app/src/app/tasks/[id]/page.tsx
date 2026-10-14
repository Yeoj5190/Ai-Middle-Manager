import Link from "next/link";
import { notFound } from "next/navigation";
import { getTask } from "@/lib/data";
import { I } from "@/components/ui";
import { TaskDetail } from "@/components/tasks/TaskDetail";

// Full-page task detail (direct navigation / refresh / "Full page" from drawer).
export default async function TaskFullPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();
  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <Link href="/tasks" className="btn btn-ghost btn-sm" style={{ color: "var(--fg-2)", marginBottom: 18 }}>
        <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><I.arrow size={14} /></span> Tasks
      </Link>
      <TaskDetail t={task} />
    </div>
  );
}
