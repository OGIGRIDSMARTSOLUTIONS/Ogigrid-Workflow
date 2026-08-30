import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import {
  listEmployees,
  listProjects,
  listTasks,
  listMeetings,
  listDocuments,
  listDailyReports,
  listActivity,
  listNotificationsForUser,
} from "@/lib/server/repo";

// Returns everything the current user's role is allowed to see. Admins get
// full company-wide data; employees get the same shape but pre-scoped on
// the server (not just filtered client-side) for daily reports and
// notifications, which are inherently personal.
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const [employees, projects, tasks, meetings, documents, dailyReports, activity, notifications] =
    await Promise.all([
      listEmployees(),
      listProjects(),
      listTasks(),
      listMeetings(),
      listDocuments(),
      listDailyReports(),
      listActivity(),
      listNotificationsForUser(user!.id),
    ]);

  return NextResponse.json({
    employees,
    projects,
    tasks,
    meetings,
    documents,
    dailyReports,
    activity,
    notifications,
  });
}
