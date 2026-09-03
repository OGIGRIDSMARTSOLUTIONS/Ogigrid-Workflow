import { Employee, TaskPriority, TaskStatus } from "./types";

export function displayJobTitle(
  employee: Pick<Employee, "jobTitle" | "role" | "isPrimaryAdmin">,
): string {
  const custom = employee.jobTitle?.trim();
  if (custom) return custom.toUpperCase();
  if (employee.isPrimaryAdmin) return "LEAD";
  if (employee.role === "Admin") return "ADMINISTRATOR";
  return "PARTNER";
}

// Starter department suggestions only — the real team can add any others.
export const departmentSuggestions = ["Software", "Marketing", "Design", "Operations"];

export const statusOptions: TaskStatus[] = [
  "To Do",
  "In Progress",
  "Review",
  "Completed",
  "Blocked",
];

export const platformOptions = [
  "Google Meet",
  "Zoom",
  "WhatsApp",
  "Microsoft Teams",
  "Slack Huddle",
  "In-Person",
  "Phone Call",
  "Other",
];

export const priorityOptions: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

export function isMeetingEnded(date: string, time: string): boolean {
  if (!date) return false;
  const now = new Date();
  const meetingTime = time || "00:00";
  const [hours, minutes] = meetingTime.split(":").map(Number);
  const meetingDate = new Date(`${date}T00:00:00`);
  meetingDate.setHours(hours || 0, minutes || 0, 0, 0);

  // Assuming a standard meeting duration buffer of ~45 minutes after start time
  // If the meeting time + 45 minutes is before now, it is considered ended
  const endedThresholdMs = meetingDate.getTime() + 45 * 60 * 1000;
  return now.getTime() > endedThresholdMs;
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function addDays(iso: string, amount: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

// Monday of the week containing the given ISO date.
export function startOfWeek(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(iso, diffToMonday);
}

// Returns 5 ISO date strings (Mon–Fri) for the week starting at weekStartIso.
export function weekDates(weekStartIso: string) {
  return Array.from({ length: 5 }, (_, i) => addDays(weekStartIso, i));
}

export function formatWeekdayHeader(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const day = date.getDate();
  return { weekday, day };
}

export function formatWeekRange(weekStartIso: string) {
  const start = new Date(`${weekStartIso}T00:00:00`);
  const end = new Date(`${addDays(weekStartIso, 4)}T00:00:00`);
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel} — ${endLabel}`;
}

export function isOverdue(deadlineIso: string, status: TaskStatus) {
  if (status === "Completed") return false;
  return deadlineIso < todayIso();
}

export function isAfter6pm(): boolean {
  const now = new Date();
  return now.getHours() >= 18;
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return statusOptions.includes(value as TaskStatus);
}

// Keep task status and progress aligned when either changes.
// Rules:
// - Completed always means 100%.
// - 100% on In Progress / Review means Completed.
// - Choosing To Do with leftover 100% reopens at 0% (cannot stay "To Do at 100%").
// - Sliding progress above 0 while on To Do promotes to In Progress.
// - Blocked cannot sit at 100%; cap at 99% so project % stays honest.
export function normalizeTaskProgressStatus(
  status: TaskStatus | string,
  progress: number
): { status: TaskStatus; progress: number } {
  let nextStatus: TaskStatus = isTaskStatus(status) ? status : "To Do";
  let nextProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));

  if (nextStatus === "Completed") {
    nextProgress = 100;
  } else if (nextProgress >= 100) {
    if (nextStatus === "To Do") {
      nextProgress = 0;
    } else if (nextStatus === "Blocked") {
      nextProgress = 99;
    } else {
      nextStatus = "Completed";
      nextProgress = 100;
    }
  } else if (nextStatus === "To Do" && nextProgress > 0) {
    nextStatus = "In Progress";
  }

  return { status: nextStatus, progress: nextProgress };
}

function taskProgressValue(task: { status: TaskStatus; progress?: number }) {
  if (task.status === "Completed") return 100;
  return Math.max(0, Math.min(100, task.progress ?? 0));
}

// Project progress is the average of each task's progress slider.
export function computeProjectProgress(projectTasks: { status: TaskStatus; progress?: number }[]) {
  if (projectTasks.length === 0) return 0;
  const total = projectTasks.reduce((sum, task) => sum + taskProgressValue(task), 0);
  return Math.round(total / projectTasks.length);
}

export function computeProjectTaskStats(projectTasks: { status: TaskStatus; progress?: number }[]) {
  const total = projectTasks.length;
  const completed = projectTasks.filter((t) => t.status === "Completed").length;
  return {
    progress: computeProjectProgress(projectTasks),
    completed,
    total,
  };
}
