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
  hasAccess?: boolean;
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium">Progress</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const canOpen = project.hasAccess ?? true;
                return (
                  <tr key={project.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {canOpen ? (
                        <Link href={`/projects/${project.id}`} className="hover:text-brand-600 hover:underline">
                          {project.name}
                        </Link>
                      ) : (
                        <span className="text-ink-muted inline-flex items-center gap-1.5" title="You are not a member of this project">
                          {project.name}
                          <span className="text-[11px] text-ink-faint font-normal">(Locked)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-canvas border border-border/60">
                          <div
                            className={`h-full rounded-full transition-all ${
                              project.progress === 100 ? "bg-emerald-500" : "bg-brand-500"
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-ink-muted">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(project.deadline)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
