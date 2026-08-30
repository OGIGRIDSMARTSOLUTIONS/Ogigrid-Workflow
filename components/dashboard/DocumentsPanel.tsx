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
    <Panel title="Recent Documents">
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
              <li key={doc.id} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{doc.name}</p>
                  <p className="text-xs text-ink-faint">
                    {project ? `Project: ${project.name}` : "Project Document"}
                  </p>
                </div>
                <span className="text-xs text-ink-faint flex-shrink-0">
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
