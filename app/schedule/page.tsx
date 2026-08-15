import { AppShell } from "@/components/layout/AppShell";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export default function SchedulePage() {
  return (
    <AppShell
      title="Team Work Schedule"
      subtitle="See what everyone is working on and update scheduled work."
    >
      <ScheduleView />
    </AppShell>
  );
}
