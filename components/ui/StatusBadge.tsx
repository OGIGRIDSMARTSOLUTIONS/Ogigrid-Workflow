import { TaskStatus } from "@/lib/types";

const styles: Record<TaskStatus, string> = {
  "To Do": "bg-status-notstartedBg text-status-notstarted",
  "In Progress": "bg-status-progressBg text-status-progress",
  Review: "bg-brand-100 text-brand-700",
  Completed: "bg-status-completedBg text-status-completed",
  Blocked: "bg-status-notsubmittedBg text-status-notsubmitted",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "Low" | "Medium" | "High" | "Urgent" }) {
  const styles: Record<string, string> = {
    Low: "bg-status-notstartedBg text-status-notstarted",
    Medium: "bg-status-progressBg text-status-progress",
    High: "bg-brand-100 text-brand-700",
    Urgent: "bg-status-notsubmittedBg text-status-notsubmitted",
  };
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export function SubmissionBadge({ submitted }: { submitted: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${
        submitted
          ? "bg-status-submittedBg text-status-submitted"
          : "bg-status-notsubmittedBg text-status-notsubmitted"
      }`}
    >
      {submitted ? "Submitted" : "Not Submitted"}
    </span>
  );
}
