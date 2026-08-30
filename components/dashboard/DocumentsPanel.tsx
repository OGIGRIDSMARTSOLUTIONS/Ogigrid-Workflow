import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { formatDateTime } from "@/lib/data";
import { DocumentItem, Project } from "@/lib/types";

export function DocumentsPanel({
  documents,
  projects,
}: {
  documents: DocumentItem[];
  projects?: Project[];
}) {
  return (
    <Panel
      title="Recent Documents"
      action={
        <Link href="/documents" className="text-xs font-medium text-brand-600 hover:underline">
          View all →
        </Link>
      }
    >
      {documents.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No documents yet.{" "}
          <Link href="/documents" className="text-brand-600 hover:underline">
            Add a document.
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => {
            const project = projects?.find((p) => p.id === doc.projectId);
            return (
              <li key={doc.id} className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="mt-0.5 text-sm flex-shrink-0">📄</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{doc.name}</p>
                    <p className="text-xs text-ink-faint truncate">
                      {project ? `Project: ${project.name}` : "Project Document"}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-ink-faint flex-shrink-0">
                  {formatDateTime(doc.updatedAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
