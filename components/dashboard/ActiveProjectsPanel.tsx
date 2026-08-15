import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/data";
import { TaskStatus } from "@/lib/types";

interface ProjectRow {
  id: string;
  name: string;
  progress: number;
  status: TaskStatus;
  deadline: string;
}

export function ActiveProjectsPanel({ projects }: { projects: ProjectRow[] }) {
  return (
    <Panel title="Active Projects" noPadding={projects.length > 0}>
      {projects.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No active projects yet.{" "}
          <Link href="/projects" className="text-brand-600 hover:underline">
            Create your first project.
          </Link>
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Progress</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink">
                  <Link href={`/projects/${project.id}`} className="hover:text-brand-600 hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-sm bg-canvas">
                      <div className="h-full bg-brand-500" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-xs text-ink-muted">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(project.deadline)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
