import { TaskStatus } from "@/lib/types";

const statusStyles: Record<TaskStatus, string> = {
  "To Do": "bg-slate-100 text-slate-600 border border-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-200 font-medium",
  Review: "bg-purple-50 text-purple-700 border border-purple-200 font-medium",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium",
  Blocked: "bg-rose-50 text-rose-700 border border-rose-200 font-medium",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs ${statusStyles[status] || "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "Low" | "Medium" | "High" | "Urgent" }) {
  const styles: Record<string, string> = {
    Low: "bg-slate-100 text-slate-600 border border-slate-200",
    Medium: "bg-blue-50 text-blue-700 border border-blue-200 font-medium",
    High: "bg-amber-50 text-amber-700 border border-amber-200 font-medium",
    Urgent: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
  };
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs ${styles[priority] || "bg-slate-100 text-slate-600"}`}>
      {priority}
    </span>
  );
}

export function SubmissionBadge({ submitted }: { submitted: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${
        submitted
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-rose-50 text-rose-700 border border-rose-200"
      }`}
    >
      {submitted ? "Submitted" : "Not Submitted"}
    </span>
  );
}

export function DepartmentBadge({ name }: { name: string }) {
  const lower = name.toLowerCase();
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";

  if (lower.includes("eng") || lower.includes("dev") || lower.includes("tech") || lower.includes("frontend") || lower.includes("backend")) {
    colorClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (lower.includes("design") || lower.includes("ui") || lower.includes("ux") || lower.includes("creative")) {
    colorClass = "bg-purple-50 text-purple-700 border-purple-200";
  } else if (lower.includes("market") || lower.includes("growth") || lower.includes("content") || lower.includes("media")) {
    colorClass = "bg-pink-50 text-pink-700 border-pink-200";
  } else if (lower.includes("product") || lower.includes("strategy") || lower.includes("mgmt")) {
    colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
  } else if (lower.includes("sales") || lower.includes("account") || lower.includes("biz")) {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (lower.includes("op") || lower.includes("hr") || lower.includes("people") || lower.includes("support")) {
    colorClass = "bg-teal-50 text-teal-700 border-teal-200";
  }

  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${colorClass}`}>
      {name}
    </span>
  );
}
