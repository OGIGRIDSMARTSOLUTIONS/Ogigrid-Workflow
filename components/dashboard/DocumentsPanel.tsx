import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { formatDateTime } from "@/lib/data";
import { DocumentItem } from "@/lib/types";

export function DocumentsPanel({ documents }: { documents: DocumentItem[] }) {
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
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between">
              <span className="text-sm text-ink">{doc.name}</span>
              <span className="text-xs text-ink-faint">{formatDateTime(doc.updatedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
