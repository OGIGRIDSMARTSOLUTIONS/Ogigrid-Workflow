"use client";

import { useRef, useState } from "react";
import Link from "next/link";
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

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType?: string, fileName?: string) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (mimeType?.includes("pdf") || ext === "pdf") {
    return "📄";
  }
  if (mimeType?.includes("image") || ["png", "jpg", "jpeg", "svg", "webp"].includes(ext || "")) {
    return "🖼️";
  }
  if (mimeType?.includes("sheet") || mimeType?.includes("csv") || ["xlsx", "xls", "csv"].includes(ext || "")) {
    return "📊";
  }
  if (mimeType?.includes("word") || ["docx", "doc", "txt", "md"].includes(ext || "")) {
    return "📝";
  }
  return "📁";
}

const emptyForm = {
  name: "",
  description: "",
  projectId: "",
  fileName: "",
  fileData: "",
  fileSize: 0,
  mimeType: "",
};

export default function DocumentsPage() {
  const { documents, projects, addDocument, updateDocument, deleteDocument } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      projectId: projects[0]?.id || "",
    });
    setModalOpen(true);
  }

  function openEdit(doc: DocumentItem) {
    setEditingId(doc.id);
    setForm({
      name: doc.name,
      description: doc.description,
      projectId: doc.projectId,
      fileName: doc.fileName || "",
      fileData: doc.fileData || "",
      fileSize: doc.fileSize || 0,
      mimeType: doc.mimeType || "",
    });
    setModalOpen(true);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Default name to file name if name not entered yet or matches old file
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({
        ...prev,
        name: prev.name.trim() ? prev.name : file.name,
        fileName: file.name,
        fileData: base64,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !currentUser) return;
    if (!form.projectId) {
      showToast("Please select a project for this document.", "error");
      return;
    }
    if (!editingId && !form.fileData) {
      showToast("Please select a file to upload.", "error");
      return;
    }

    setUploading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        projectId: form.projectId,
        fileName: form.fileName || form.name.trim(),
        fileData: form.fileData || undefined,
        fileSize: form.fileSize || undefined,
        mimeType: form.mimeType || undefined,
      };

      if (editingId) {
        await updateDocument(editingId, payload);
        showToast("Document updated successfully.");
      } else {
        await addDocument(payload);
        showToast("Document uploaded successfully.");
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to save document.", "error");
    } finally {
      setUploading(false);
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

  async function handleDownloadDocument(doc: DocumentItem) {
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to access document.");
      }
      const fetchedDoc = data.document;
      if (fetchedDoc.fileData) {
        // Create a blob URL from data URL or download directly
        const resBlob = await fetch(fetchedDoc.fileData);
        const blob = await resBlob.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fetchedDoc.fileName || fetchedDoc.name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        showToast("No binary file attached to this record.", "error");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Access denied.", "error");
    }
  }

  async function handleViewDocument(doc: DocumentItem) {
    try {
      // Securely fetch file data from backend
      const res = await fetch(`/api/documents/${doc.id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to access document.");
      }
      const fetchedDoc = data.document;
      if (fetchedDoc.fileData) {
        // Convert data URL to Blob URL for clean browser preview (PDF, Images, etc.)
        const resBlob = await fetch(fetchedDoc.fileData);
        const blob = await resBlob.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } else {
        showToast("No binary file attached to this record.", "error");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Access denied.", "error");
    }
  }

  return (
    <AppShell title="Documents" subtitle="Keep track of important project documents and specifications.">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </p>
          <PrimaryButton onClick={openCreate}>+ Upload Document</PrimaryButton>
        </div>

        {documents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Upload project documents to keep the team's specifications and assets organized."
            action={<PrimaryButton onClick={openCreate}>+ Upload Document</PrimaryButton>}
          />
        ) : (
          <Panel noPadding>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
                    <th className="px-4 py-2 font-medium">Document</th>
                    <th className="px-4 py-2 font-medium">Project</th>
                    <th className="px-4 py-2 font-medium">Size</th>
                    <th className="px-4 py-2 font-medium">Last updated</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const project = projects.find((p) => p.id === doc.projectId);
                    const hasAccess = isAdmin || (project ? project.memberIds.includes(currentUser.id) : false);

                    return (
                      <tr
                        key={doc.id}
                        className={`border-b border-border last:border-0 ${
                          !hasAccess ? "bg-canvas/40" : "hover:bg-canvas"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <span className="text-lg leading-none mt-0.5">
                              {getFileIcon(doc.mimeType, doc.fileName || doc.name)}
                            </span>
                            <div>
                              <p className="font-medium text-ink">{doc.name}</p>
                              {doc.fileName && doc.fileName !== doc.name && (
                                <p className="text-[11px] text-ink-faint">{doc.fileName}</p>
                              )}
                              {doc.description && (
                                <p className="mt-0.5 max-w-sm truncate text-xs text-ink-faint">
                                  {doc.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {project ? (
                            hasAccess ? (
                              <Link
                                href={`/projects/${project.id}`}
                                className="font-medium text-brand-600 hover:underline"
                              >
                                {project.name}
                              </Link>
                            ) : (
                              <span className="text-ink-muted inline-flex items-center gap-1">
                                {project.name}
                                <span className="text-[10px] text-ink-faint">(Locked)</span>
                              </span>
                            )
                          ) : (
                            <span className="text-status-notsubmitted font-medium">Missing Project</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted">
                          {formatFileSize(doc.fileSize) || "—"}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{formatDateTime(doc.updatedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasAccess ? (
                              <>
                                <button
                                  onClick={() => handleViewDocument(doc)}
                                  className="rounded bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                                  title="Open & view document in browser"
                                >
                                  👁️ View
                                </button>
                                <button
                                  onClick={() => handleDownloadDocument(doc)}
                                  className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                                  title="Download file to device"
                                >
                                  📥 Download
                                </button>
                              </>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded bg-canvas border border-border px-2 py-0.5 text-xs text-ink-faint"
                                title="You are not a member of this project"
                              >
                                🔒 Inaccessible
                              </span>
                            )}
                            {hasAccess && (
                              <button
                                onClick={() => openEdit(doc)}
                                className="text-xs font-medium text-brand-600 hover:underline ml-1"
                              >
                                Edit
                              </button>
                            )}
                            {(isAdmin || hasAccess) && (
                              <DangerLink onClick={() => setDeleteTarget(doc)}>Delete</DangerLink>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editingId ? "Edit Document" : "Upload Project Document"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. File Upload */}
            <Field
              label={editingId ? "Replace File (optional)" : "Select File"}
              hint="Select a PDF, image, spreadsheet, or document."
            >
              <input
                ref={fileInputRef}
                type="file"
                className="input"
                onChange={handleFileSelected}
                required={!editingId && !form.fileData}
              />
              {form.fileName && (
                <p className="mt-1 text-xs text-brand-700 font-medium">
                  Selected: {form.fileName} {form.fileSize ? `(${formatFileSize(form.fileSize)})` : ""}
                </p>
              )}
            </Field>

            {/* 2. Project Selection (Required) */}
            <Field label="Associated Project (Required)" hint="Every document must belong to a project.">
              <select
                className="input"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                required
              >
                <option value="" disabled>
                  -- Select an existing project --
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* 3. Document Name */}
            <Field label="Document Title">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Capability.pdf, Specifications, Architecture Plan"
                required
              />
            </Field>

            {/* 4. Description */}
            <Field label="Description (optional)">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief summary or purpose of this document"
              />
            </Field>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <SecondaryButton
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                loading={uploading}
                loadingText={editingId ? "Saving changes..." : "Uploading document..."}
                className="w-full sm:w-auto"
              >
                {editingId ? "Save Changes" : "Upload Document"}
              </PrimaryButton>
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
