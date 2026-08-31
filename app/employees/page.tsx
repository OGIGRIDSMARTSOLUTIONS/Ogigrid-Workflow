"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Field, PrimaryButton, SecondaryButton, DangerLink } from "@/components/ui/FormControls";
import { useApp, EmployeeRemovalStrategy } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { departmentSuggestions } from "@/lib/data";
import { DepartmentBadge } from "@/components/ui/StatusBadge";
import { Employee, EmployeeStatus, Role } from "@/lib/types";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  departments: [] as string[],
  status: "Active" as EmployeeStatus,
  accountRole: "Employee" as Role,
};

export default function EmployeesPage() {
  const { employees, tasks, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [customDepartment, setCustomDepartment] = useState("");
  const [removalTarget, setRemovalTarget] = useState<Employee | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setCustomDepartment("");
    setModalOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      email: employee.email,
      password: "",
      departments: employee.departments,
      status: employee.status,
      accountRole: employee.role,
    });
    setCustomDepartment("");
    setModalOpen(true);
  }

  function toggleDepartment(dep: string) {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dep)
        ? prev.departments.filter((d) => d !== dep)
        : [...prev.departments, dep],
    }));
  }

  function addCustomDepartment() {
    const dep = customDepartment.trim();
    if (!dep || form.departments.includes(dep)) return;
    setForm((prev) => ({ ...prev, departments: [...prev.departments, dep] }));
    setCustomDepartment("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        // Admin updates workspace-level attributes only
        const patch: Record<string, unknown> = {
          departments: form.departments,
          status: form.status,
          role: form.accountRole,
        };
        await updateEmployee(editingId, patch);
        showToast("Employee workspace details updated successfully.");
      } else {
        if (!form.name.trim() || !form.email.trim()) {
          showToast("Name and email are required.", "error");
          setSubmitting(false);
          return;
        }
        if (!form.password.trim()) {
          showToast("A temporary password is required.", "error");
          setSubmitting(false);
          return;
        }
        await addEmployee({
          name: form.name,
          role: form.accountRole,
          email: form.email,
          password: form.password,
          departments: form.departments,
          status: form.status,
        });
        showToast("Employee added successfully.");
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePromoteDemote(employee: Employee) {
    try {
      const nextRole: Role = employee.role === "Admin" ? "Employee" : "Admin";
      await updateEmployee(employee.id, { role: nextRole });
      showToast(nextRole === "Admin" ? "Employee promoted to Administrator." : "Administrator demoted to Employee.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to change role.", "error");
    }
  }

  function activeTaskCount(employeeId: string) {
    return tasks.filter((t) => t.assigneeId === employeeId && t.status !== "Completed").length;
  }

  async function handleConfirmDelete() {
    if (!removalTarget) return;
    const strategy: EmployeeRemovalStrategy = reassignTo
      ? { type: "reassign", toEmployeeId: reassignTo }
      : { type: "unassign" };
    try {
      await deleteEmployee(removalTarget.id, strategy);
      showToast("Employee removed successfully.");
      setRemovalTarget(null);
      setReassignTo("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to remove employee.", "error");
    }
  }

  const allDepartments = Array.from(
    new Set([...departmentSuggestions, ...employees.flatMap((e) => e.departments)])
  );

  return (
    <AppShell title="Employees" subtitle="Everyone on the Ogigrid team.">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {employees.length} {employees.length === 1 ? "member" : "members"}
          </p>
          {isAdmin && <PrimaryButton onClick={openCreate}>+ Add Employee</PrimaryButton>}
        </div>

        {employees.length === 0 ? (
          <EmptyState
            title="No employees added"
            description="Add team members so they can be assigned to projects, tasks and the schedule."
            action={isAdmin ? <PrimaryButton onClick={openCreate}>+ Add Employee</PrimaryButton> : undefined}
          />
        ) : (
          <Panel noPadding>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">Departments</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    {isAdmin && <th className="px-4 py-2 font-medium" />}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-border last:border-0 hover:bg-canvas">
                      <td className="px-4 py-3">
                        <Link href={`/employees/${employee.id}`} className="flex items-center gap-2 hover:text-brand-600">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-brand-100 text-xs font-semibold text-brand-700">
                            {employee.initials}
                          </div>
                          <span className="font-medium text-ink hover:underline">{employee.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              employee.role === "Admin"
                                ? "bg-brand-100 text-brand-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {employee.role === "Admin" ? "Administrator" : "Employee"}
                          </span>
                          {employee.isPrimaryAdmin && (
                            <span className="rounded-sm bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                              Primary
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {employee.departments.length ? (
                          <div className="flex flex-wrap gap-1">
                            {employee.departments.map((dept) => (
                              <DepartmentBadge key={dept} name={dept} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{employee.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${
                            employee.status === "Active"
                              ? "bg-status-completedBg text-status-completed"
                              : "bg-status-notstartedBg text-status-notstarted"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEdit(employee)}
                              className="text-xs font-medium text-brand-600 hover:underline"
                            >
                              Edit
                            </button>
                            {!employee.isPrimaryAdmin && (
                              <button
                                onClick={() => handlePromoteDemote(employee)}
                                className="text-xs font-medium text-brand-600 hover:underline"
                              >
                                {employee.role === "Admin" ? "Demote" : "Promote"}
                              </button>
                            )}
                            {!employee.isPrimaryAdmin && (
                              <DangerLink onClick={() => setRemovalTarget(employee)}>Remove</DangerLink>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingId ? "Edit Workspace Role & Departments" : "Add Employee"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editingId ? (
              <div className="rounded-md border border-border bg-canvas/60 p-3 text-xs text-ink-muted space-y-1.5">
                <p>
                  <strong className="text-ink font-medium">Employee:</strong> {form.name}
                </p>
                <p>
                  <strong className="text-ink font-medium">Email:</strong> {form.email}
                </p>
                <p className="text-[11px] text-ink-faint pt-1 border-t border-border">
                  ℹ️ Personal details (name, email, password) are managed directly by each employee in their Account Settings.
                </p>
              </div>
            ) : (
              <>
                <Field label="Name">
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoFocus
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@ogigrid.com"
                    required
                  />
                </Field>
                <Field
                  label="Temporary password"
                  hint="Used by this employee to log in for the first time."
                >
                  <input
                    type="text"
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </Field>
              </>
            )}

            <Field label="Account role">
              <select
                className="input"
                value={form.accountRole}
                disabled={editingId === currentUser.id && !!employees.find((e) => e.id === editingId)?.isPrimaryAdmin}
                onChange={(e) => setForm({ ...form, accountRole: e.target.value as Role })}
              >
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </Field>
            <Field label="Departments" hint="An employee can belong to more than one department.">
              <div className="flex flex-wrap gap-2">
                {allDepartments.map((dep) => (
                  <button
                    type="button"
                    key={dep}
                    onClick={() => toggleDepartment(dep)}
                    className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                      form.departments.includes(dep)
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-border bg-canvas text-ink-muted hover:border-brand-300"
                    }`}
                  >
                    {dep}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="input"
                  placeholder="Add another department"
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomDepartment();
                    }
                  }}
                />
                <SecondaryButton type="button" onClick={addCustomDepartment}>
                  Add
                </SecondaryButton>
              </div>
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <SecondaryButton
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                loading={submitting}
                loadingText={editingId ? "Saving changes..." : "Adding employee..."}
                className="w-full sm:w-auto"
              >
                {editingId ? "Save Changes" : "Add Employee"}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {removalTarget && (
        <Modal title="Remove employee" onClose={() => { setRemovalTarget(null); setReassignTo(""); }}>
          <p className="text-sm text-ink-muted">
            {activeTaskCount(removalTarget.id) > 0
              ? `${removalTarget.name} has ${activeTaskCount(removalTarget.id)} active task(s). Choose whether to reassign them below, or leave them unassigned.`
              : `Remove ${removalTarget.name} from the team? Their account will be deactivated — daily reports and activity history will be preserved.`}
          </p>
          {activeTaskCount(removalTarget.id) > 0 && (
            <div className="mt-4">
              <Field label="Reassign active tasks to (optional)">
                <select className="input" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                  <option value="">Leave unassigned</option>
                  {employees
                    .filter((e) => e.id !== removalTarget.id)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <SecondaryButton
              type="button"
              onClick={() => {
                setRemovalTarget(null);
                setReassignTo("");
              }}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={handleConfirmDelete}
              className="bg-status-notsubmitted hover:bg-status-notsubmitted"
            >
              Remove Employee
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
