import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SubmissionBadge } from "@/components/ui/StatusBadge";
import { Employee } from "@/lib/types";

export function DailyReportsPanel({
  employees,
  submittedIds,
}: {
  employees: Employee[];
  submittedIds: Set<string>;
}) {
  return (
    <Panel title="Today's Daily Reports">
      {employees.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No daily reports yet.{" "}
          <Link href="/employees" className="text-brand-600 hover:underline">
            Add team members
          </Link>{" "}
          to start tracking reports.
        </p>
      ) : (
        <ul className="space-y-3">
          {employees.map((employee) => (
            <li key={employee.id} className="flex items-center justify-between">
              <span className="text-sm text-ink">{employee.name}</span>
              <SubmissionBadge submitted={submittedIds.has(employee.id)} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
