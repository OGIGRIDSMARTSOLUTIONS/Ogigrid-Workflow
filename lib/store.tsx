"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityItem,
  AppNotification,
  DailyReport,
  DocumentItem,
  Employee,
  Meeting,
  Project,
  ReportComment,
  Task,
} from "./types";
import { useAuth } from "./auth";

interface AppState {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  documents: DocumentItem[];
  dailyReports: DailyReport[];
  reportComments: ReportComment[];
  activity: ActivityItem[];
  notifications: AppNotification[];
}

const emptyState: AppState = {
  employees: [],
  projects: [],
  tasks: [],
  meetings: [],
  documents: [],
  dailyReports: [],
  reportComments: [],
  activity: [],
  notifications: [],
};

export type EmployeeRemovalStrategy = { type: "unassign" } | { type: "reassign"; toEmployeeId: string };

async function api<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

interface AppActions {
  refetch: () => Promise<void>;

  addEmployee: (input: {
    name: string;
    email: string;
    password: string;
    role: "Admin" | "Employee";
    departments: string[];
    status: "Active" | "Inactive";
  }) => Promise<Employee>;
  updateEmployee: (id: string, patch: Record<string, unknown>) => Promise<Employee>;
  deleteEmployee: (id: string, strategy: EmployeeRemovalStrategy) => Promise<void>;
  updateOwnAccount: (patch: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    password?: string;
  }) => Promise<Employee>;
  deleteOwnAccount: () => Promise<void>;

  addProject: (input: {
    name: string;
    description: string;
    status: string;
    startDate: string;
    deadline: string;
    memberIds: string[];
  }) => Promise<Project>;
  updateProject: (id: string, patch: Record<string, unknown>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  addProjectMember: (projectId: string, employeeId: string) => Promise<void>;
  removeProjectMember: (projectId: string, employeeId: string) => Promise<void>;

  addTask: (input: Record<string, unknown>) => Promise<Task>;
  updateTask: (id: string, patch: Record<string, unknown>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  addMeeting: (input: Record<string, unknown>) => Promise<Meeting>;
  updateMeeting: (id: string, patch: Record<string, unknown>) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;

  addDocument: (input: Record<string, unknown>) => Promise<DocumentItem>;
  updateDocument: (id: string, patch: Record<string, unknown>) => Promise<DocumentItem>;
  deleteDocument: (id: string) => Promise<void>;

  addDailyReport: (input: Record<string, unknown>) => Promise<DailyReport>;
  updateDailyReport: (id: string, patch: Record<string, unknown>) => Promise<DailyReport>;
  addReportComment: (reportId: string, body: string) => Promise<ReportComment>;
  deleteReportComment: (reportId: string, commentId: string) => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

type AppContextValue = AppState & AppActions & { hydrated: boolean };

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { currentUser, hydrated: authHydrated, refresh: refreshAuth } = useAuth();
  const [state, setState] = useState<AppState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  const refetch = useCallback(async () => {
    if (!currentUser) {
      setState(emptyState);
      return;
    }
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) {
        setState(emptyState);
        return;
      }
      const data = await res.json();
      setState({ ...emptyState, ...data });
    } catch {
      setState(emptyState);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!authHydrated) return;
    refetch().finally(() => setHydrated(true));
  }, [authHydrated, currentUser, refetch]);

  // Every mutation follows the same pattern: call the API, then refresh the
  // whole app state from the server so every page stays in sync (dashboard,
  // schedule, notifications, activity, etc. all derive from one fetch).
  async function mutate<T>(url: string, options: RequestInit, extract: (data: any) => T): Promise<T> {
    const data = await api<any>(url, options);
    await refetch();
    return extract(data);
  }

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      hydrated,
      refetch,

      addEmployee: (input) =>
        mutate("/api/employees", { method: "POST", body: JSON.stringify(input) }, (d) => d.employee),
      updateEmployee: (id, patch) =>
        mutate(`/api/employees/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, (d) => d.employee),
      deleteEmployee: (id, strategy) =>
        mutate(
          `/api/employees/${id}`,
          {
            method: "DELETE",
            body: JSON.stringify(
              strategy.type === "reassign" ? { reassignToEmployeeId: strategy.toEmployeeId } : {}
            ),
          },
          () => undefined
        ),
      updateOwnAccount: async (patch) => {
        const employee = await mutate("/api/account", { method: "PATCH", body: JSON.stringify(patch) }, (d) => d.employee);
        await refreshAuth();
        return employee;
      },
      deleteOwnAccount: () => mutate("/api/account", { method: "DELETE" }, () => undefined),

      addProject: (input) =>
        mutate("/api/projects", { method: "POST", body: JSON.stringify(input) }, (d) => d.project),
      updateProject: (id, patch) =>
        mutate(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, (d) => d.project),
      deleteProject: (id) => mutate(`/api/projects/${id}`, { method: "DELETE" }, () => undefined),
      addProjectMember: (projectId, employeeId) =>
        mutate(
          `/api/projects/${projectId}/members`,
          { method: "POST", body: JSON.stringify({ employeeId }) },
          () => undefined
        ),
      removeProjectMember: (projectId, employeeId) =>
        mutate(`/api/projects/${projectId}/members/${employeeId}`, { method: "DELETE" }, () => undefined),

      addTask: (input) => mutate("/api/tasks", { method: "POST", body: JSON.stringify(input) }, (d) => d.task),
      updateTask: (id, patch) =>
        mutate(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, (d) => d.task),
      deleteTask: (id) => mutate(`/api/tasks/${id}`, { method: "DELETE" }, () => undefined),

      addMeeting: (input) =>
        mutate("/api/meetings", { method: "POST", body: JSON.stringify(input) }, (d) => d.meeting),
      updateMeeting: (id, patch) =>
        mutate(`/api/meetings/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, (d) => d.meeting),
      deleteMeeting: (id) => mutate(`/api/meetings/${id}`, { method: "DELETE" }, () => undefined),

      addDocument: (input) =>
        mutate("/api/documents", { method: "POST", body: JSON.stringify(input) }, (d) => d.document),
      updateDocument: (id, patch) =>
        mutate(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, (d) => d.document),
      deleteDocument: (id) => mutate(`/api/documents/${id}`, { method: "DELETE" }, () => undefined),

      addDailyReport: (input) =>
        mutate("/api/daily-reports", { method: "POST", body: JSON.stringify(input) }, (d) => d.report),
      updateDailyReport: (id, patch) =>
        mutate(`/api/daily-reports/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, (d) => d.report),
      addReportComment: (reportId, body) =>
        mutate(
          `/api/daily-reports/${reportId}/comments`,
          { method: "POST", body: JSON.stringify({ body }) },
          (d) => d.comment
        ),
      deleteReportComment: (reportId, commentId) =>
        mutate(`/api/daily-reports/${reportId}/comments/${commentId}`, { method: "DELETE" }, () => undefined),

      markNotificationRead: (id) =>
        mutate(`/api/notifications/${id}/read`, { method: "PATCH" }, () => undefined),
      markAllNotificationsRead: () =>
        mutate(`/api/notifications/mark-all-read`, { method: "POST" }, () => undefined),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, hydrated, refetch]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
