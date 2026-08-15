"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, Field, PrimaryButton, SecondaryButton, DangerLink } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/data";
import { DocumentItem } from "@/lib/types";

const emptyForm = {
  name: "",
  description: "",
  projectId: "",
};

export default function DocumentsPage() {
  const { documents, projects, addDocument, updateDocument, deleteDocument } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(doc: DocumentItem) {
    setEditingId(doc.id);
    setForm({ name: doc.name, description: doc.description, projectId: doc.projectId ?? "" });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !currentUser) return;
    const payload = {
      name: form.name,
      description: form.description,
      projectId: form.projectId || null,
    };
    try {
      if (editingId) {
        await updateDocument(editingId, payload);
        showToast("Document updated successfully.");
      } else {
        await addDocument(payload);
        showToast("Document added successfully.");
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to save document.", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !currentUser) return;
    try {
      await deleteDocument(deleteTarget.id);
      showToast("Document deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to delete document.", "error");
    }
  }

  return (
    <AppShell title="Documents" subtitle="Keep track of important project documents.">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </p>
          {isAdmin && <PrimaryButton onClick={openCreate}>+ Add Document</PrimaryButton>}
        </div>

        {documents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Add a document record to keep the team's references organized."
            action={isAdmin ? <PrimaryButton onClick={openCreate}>+ Add Document</PrimaryButton> : undefined}
          />
        ) : (
          <Panel noPadding>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-2 font-medium">Document</th>
                  <th className="px-4 py-2 font-medium">Project</th>
                  <th className="px-4 py-2 font-medium">Last updated</th>
                  {isAdmin && <th className="px-4 py-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const project = projects.find((p) => p.id === doc.projectId);
                  return (
                    <tr key={doc.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{doc.name}</p>
                        {doc.description && (
                          <p className="mt-0.5 max-w-sm truncate text-xs text-ink-faint">
                            {doc.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{project?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-muted">{formatDateTime(doc.updatedAt)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEdit(doc)}
                              className="text-xs font-medium text-brand-600 hover:underline"
                            >
                              Edit
                            </button>
                            <DangerLink onClick={() => setDeleteTarget(doc)}>Delete</DangerLink>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingId ? "Edit Document" : "Add Document"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Document name">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </Field>
            <Field label="Description">
              <textarea
                className="input min-h-[70px] resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field
              label="Related project"
              hint={projects.length === 0 ? "No projects yet — this is optional." : undefined}
            >
              <select
                className="input"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">{editingId ? "Save Changes" : "Add Document"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete document"
          description={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
