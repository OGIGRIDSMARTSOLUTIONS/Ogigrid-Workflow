"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { Field, PrimaryButton, SecondaryButton, DangerLink } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { departmentSuggestions } from "@/lib/data";

export default function SettingsPage() {
  const { employees, projects, updateOwnAccount, deleteOwnAccount } = useApp();
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("Ogigrid");
  const [saving, setSaving] = useState(false);

  const [account, setAccount] = useState({
    firstName: currentUser?.firstName ?? "",
    lastName: currentUser?.lastName ?? "",
    email: currentUser?.email ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setAccount((prev) => ({
        ...prev,
        firstName:
          currentUser.firstName !== undefined
            ? currentUser.firstName
            : (currentUser.name ?? "").split(" ")[0] || "",
        lastName:
          currentUser.lastName !== undefined
            ? currentUser.lastName
            : (currentUser.name ?? "").split(" ").slice(1).join(" ") || "",
        email: currentUser.email ?? "",
      }));
    }
  }, [currentUser]);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  const activeDepartments = Array.from(
    new Set([...departmentSuggestions, ...employees.flatMap((e) => e.departments)])
  );

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();

    const firstName = account.firstName.trim();
    const lastName = account.lastName.trim();
    const email = account.email.trim();

    if (!firstName && !lastName) {
      showToast("Please enter your name.", "error");
      return;
    }
    if (!email) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    if (account.newPassword) {
      if (!account.currentPassword) {
        showToast("Please enter your current password to set a new password.", "error");
        return;
      }
      if (account.newPassword.length < 6) {
        showToast("New password must be at least 6 characters.", "error");
        return;
      }
      if (account.newPassword !== account.confirmPassword) {
        showToast("New passwords do not match.", "error");
        return;
      }
    }

    setSaving(true);
    try {
      const patch: {
        firstName: string;
        lastName: string;
        email: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        firstName,
        lastName,
        email,
      };

      if (account.newPassword) {
        patch.currentPassword = account.currentPassword;
        patch.newPassword = account.newPassword;
      }

      await updateOwnAccount(patch);
      showToast("Account settings updated successfully.");
      setAccount((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to update account.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteOwnAccount();
      await logout();
      showToast("Your account was deleted.");
      router.push("/login");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to delete account.", "error");
      setConfirmDelete(false);
    }
  }

  return (
    <AppShell title="Settings" subtitle="Workspace and account configuration.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="My Account">
          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="First name">
                <input
                  className="input"
                  value={account.firstName}
                  onChange={(e) => setAccount({ ...account, firstName: e.target.value })}
                  placeholder="First name"
                  required
                />
              </Field>
              <Field label="Last name">
                <input
                  className="input"
                  value={account.lastName}
                  onChange={(e) => setAccount({ ...account, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </Field>
            </div>

            <Field label="Email address">
              <input
                type="email"
                className="input"
                value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })}
                required
              />
            </Field>

            <div className="border-t border-border/80 pt-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Change Password
              </p>
              <Field
                label="Current password"
                hint="Required only if you are changing your password."
              >
                <input
                  type="password"
                  className="input"
                  value={account.currentPassword}
                  onChange={(e) => setAccount({ ...account, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="New password"
                  hint="Minimum 6 characters."
                >
                  <input
                    type="password"
                    className="input"
                    value={account.newPassword}
                    onChange={(e) => setAccount({ ...account, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </Field>

                <Field label="Confirm new password">
                  <input
                    type="password"
                    className="input"
                    value={account.confirmPassword}
                    onChange={(e) => setAccount({ ...account, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </Field>
              </div>
            </div>

            <Field label="Role">
              <p className="pt-1.5 text-sm text-ink-muted">
                {currentUser.role}
                {currentUser.isPrimaryAdmin && " · Primary Administrator"}
              </p>
            </Field>

            <div className="pt-2">
              <PrimaryButton
                type="submit"
                loading={saving}
                loadingText="Saving settings..."
                className="w-full sm:w-auto"
              >
                Save Account Settings
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Danger zone</p>
            {currentUser.isPrimaryAdmin ? (
              <p className="mt-2 text-sm text-ink-faint">
                As the workspace's Primary Administrator, your account cannot be deleted.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  Deleting your account deactivates it — you'll no longer be able to log in, but
                  your completed tasks and daily reports stay in the company's history.
                </p>
                <DangerLink className="mt-2" onClick={() => setConfirmDelete(true)}>
                  Delete my account
                </DangerLink>
              </>
            )}
          </div>
        </Panel>

        {isAdmin && (
          <Panel title="Workspace">
            <div className="space-y-4">
              <Field label="Workspace name">
                <input
                  className="input"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </Field>
              <Field label="Logo">
                <div className="flex items-center gap-3 rounded-sm border border-dashed border-border bg-canvas px-3 py-3">
                  <div className="h-9 w-9 overflow-hidden rounded-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/ogigrid-logo.jpg" alt="Ogigrid" className="h-full w-full object-cover" />
                  </div>
                  <p className="text-xs text-ink-faint">Official Ogigrid brand mark.</p>
                </div>
              </Field>
              <PrimaryButton type="button" onClick={() => showToast("Workspace settings saved.")}>
                Save
              </PrimaryButton>
            </div>
          </Panel>
        )}

        {isAdmin && (
          <Panel title="Departments">
            <p className="text-sm text-ink-muted">
              Departments currently in use across the team. New departments can be added from the
              Employees page when adding or editing a team member.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeDepartments.map((dep) => (
                <span
                  key={dep}
                  className="rounded-sm border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted"
                >
                  {dep}
                </span>
              ))}
            </div>
          </Panel>
        )}

        {isAdmin && (
          <Panel title="Workspace summary">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Employees</p>
                <p className="mt-0.5 text-lg font-semibold text-ink">{employees.length}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Projects</p>
                <p className="mt-0.5 text-lg font-semibold text-ink">{projects.length}</p>
              </div>
            </div>
          </Panel>
        )}

        {isAdmin && (
          <Panel title="Permissions">
            <p className="text-sm text-ink-muted">
              Admins can manage employees, projects, tasks, meetings and documents. The Primary
              Administrator can never be removed, demoted, or deactivated by anyone, including
              other Admins. Employees can view what they're assigned to or a member of, update
              their own task status/progress, and submit their own daily reports.
            </p>
          </Panel>
        )}
      </div>

      {confirmDelete && (
        <Modal title="Delete your account" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm text-ink-muted">
            Are you sure you want to delete your account? This cannot be undone — you'll be
            signed out immediately.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setConfirmDelete(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={handleDeleteAccount}
              className="bg-status-notsubmitted hover:bg-status-notsubmitted"
            >
              Delete Account
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
