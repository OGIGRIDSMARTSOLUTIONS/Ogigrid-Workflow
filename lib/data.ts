import { TaskPriority, TaskStatus } from "./types";

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

// Project progress is derived strictly from how many of its tasks are
// Completed — not from each task's individual progress slider — so it
// matches the simple "X of Y tasks completed" mental model.
export function computeProjectProgress(projectTasks: { status: TaskStatus }[]) {
  if (projectTasks.length === 0) return 0;
  const completed = projectTasks.filter((t) => t.status === "Completed").length;
  return Math.round((completed / projectTasks.length) * 100);
}
