export type TaskStatus = "To Do" | "In Progress" | "Review" | "Completed" | "Blocked";

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export type EmployeeStatus = "Active" | "Inactive";

export type Role = "Admin" | "Employee";

// Departments are free-form strings so the real Ogigrid team can define their
// own departments. A small starter list is offered in forms, but any value
// can be entered and employees can belong to more than one.
export type Department = string;

export interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  initials: string;
  role: Role;
  email: string;
  departments: Department[];
  status: EmployeeStatus;
  isPrimaryAdmin?: boolean; // the workspace's permanent Owner — created at signup, cannot be removed/demoted
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  startDate: string; // ISO yyyy-mm-dd
  deadline: string; // ISO yyyy-mm-dd
  memberIds: string[];
  createdAt: string; // ISO timestamp
}

export interface Task {
  id: string;
  name: string;
  description: string;
  projectId: string;
  assigneeId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string; // ISO yyyy-mm-dd, used to place the task on the schedule
  durationDays: number;
  deadline: string; // ISO yyyy-mm-dd
  progress: number; // 0-100
  dependsOnTaskId: string | null;
  createdAt: string; // ISO timestamp
}

export interface DailyReport {
  id: string;
  employeeId: string;
  date: string; // ISO yyyy-mm-dd
  workedOn: string;
  completed: string;
  remaining: string;
  blockers: string;
  submittedAt: string; // ISO timestamp
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // e.g. "09:30"
  attendeeIds: string[];
  projectId: string | null;
  details: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  description: string;
  projectId: string | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface ActivityItem {
  id: string;
  description: string;
  timestamp: string; // ISO timestamp
}

export type NotificationType =
  | "task-assigned"
  | "task-unassigned"
  | "task-status"
  | "daily-report"
  | "meeting"
  | "project-membership"
  | "announcement";

export interface AppNotification {
  id: string;
  userId: string; // recipient — a notification always belongs to exactly one user
  type: NotificationType;
  title: string;
  message: string;
  relatedType: "task" | "project" | "meeting" | "report" | "employee" | null;
  relatedId: string | null;
  read: boolean;
  createdAt: string; // ISO timestamp
}
