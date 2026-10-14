import { notFound } from "next/navigation";
import { getTask } from "@/lib/data";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";

// Intercepts /tasks/[id] when navigated from the board → renders the slide-out.
export default async function TaskDrawerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();
  return (
    <TaskDrawer id={id}>
      <TaskDetail t={task} />
    </TaskDrawer>
  );
}
