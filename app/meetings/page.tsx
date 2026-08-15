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
import { formatDate, todayIso } from "@/lib/data";
import { Meeting } from "@/lib/types";

const emptyForm = {
  title: "",
  date: todayIso(),
  time: "09:00",
  attendeeIds: [] as string[],
  projectId: "",
  details: "",
};

export default function MeetingsPage() {
  const { meetings, employees, projects, addMeeting, updateMeeting, deleteMeeting } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  const visibleMeetings = isAdmin
    ? meetings
    : meetings.filter(
        (m) =>
          m.attendeeIds.includes(currentUser.id) ||
          (m.projectId && projects.find((p) => p.id === m.projectId)?.memberIds.includes(currentUser.id))
      );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(meeting: Meeting) {
    setEditingId(meeting.id);
    setForm({
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      attendeeIds: meeting.attendeeIds,
      projectId: meeting.projectId ?? "",
      details: meeting.details,
    });
    setModalOpen(true);
  }

  function toggleAttendee(id: string) {
    setForm((prev) => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(id)
        ? prev.attendeeIds.filter((a) => a !== id)
        : [...prev.attendeeIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !currentUser) return;
    const payload = { ...form, projectId: form.projectId || null };
    try {
      if (editingId) {
        await updateMeeting(editingId, payload);
        showToast("Meeting updated successfully.");
      } else {
        await addMeeting(payload);
        showToast("Meeting scheduled successfully.");
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to save meeting.", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !currentUser) return;
    try {
      await deleteMeeting(deleteTarget.id);
      showToast("Meeting deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to delete meeting.", "error");
    }
  }

  const sortedMeetings = [...visibleMeetings].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell
      title="Meetings"
      subtitle={isAdmin ? "Schedule and track team meetings." : "Meetings relevant to you."}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {sortedMeetings.length} {sortedMeetings.length === 1 ? "meeting" : "meetings"}
          </p>
          {isAdmin && <PrimaryButton onClick={openCreate}>+ Add Meeting</PrimaryButton>}
        </div>

        {sortedMeetings.length === 0 ? (
          <EmptyState
            title="No meetings scheduled"
            description={isAdmin ? "Add a meeting to keep the team coordinated." : "You have no upcoming meetings."}
            action={isAdmin ? <PrimaryButton onClick={openCreate}>+ Add Meeting</PrimaryButton> : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {sortedMeetings.map((meeting) => {
              const project = projects.find((p) => p.id === meeting.projectId);
              const attendees = employees.filter((e) => meeting.attendeeIds.includes(e.id));
              return (
                <Panel key={meeting.id} className="h-fit">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">{meeting.title}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {formatDate(meeting.date)} · {meeting.time}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(meeting)}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          Edit
                        </button>
                        <DangerLink onClick={() => setDeleteTarget(meeting)}>Delete</DangerLink>
                      </div>
                    )}
                  </div>
                  {project && (
                    <p className="mt-2 text-xs text-ink-muted">Project: {project.name}</p>
                  )}
                  {attendees.length > 0 && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Attendees: {attendees.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  {meeting.details && (
                    <p className="mt-2 text-sm text-ink-muted">{meeting.details}</p>
                  )}
                </Panel>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingId ? "Edit Meeting" : "Add Meeting"} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title">
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  className="input"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </Field>
            </div>

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

            <Field
              label="Attendees"
              hint={employees.length === 0 ? "No employees added yet." : undefined}
            >
              <div className="flex flex-wrap gap-2">
                {employees.map((employee) => (
                  <button
                    type="button"
                    key={employee.id}
                    onClick={() => toggleAttendee(employee.id)}
                    className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                      form.attendeeIds.includes(employee.id)
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-border bg-canvas text-ink-muted hover:border-brand-300"
                    }`}
                  >
                    {employee.name}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Details">
              <textarea
                className="input min-h-[70px] resize-none"
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">{editingId ? "Save Changes" : "Add Meeting"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete meeting"
          description={`Delete "${deleteTarget.title}"? Attendees will be notified. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
