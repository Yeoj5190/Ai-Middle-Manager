// Typed view over the demo dataset (src/data/seed.json). Single source of truth,
// shared by the dev-fallback data layer and the Supabase seed script.
import seedJson from "@/data/seed.json";
import type {
  Briefing,
  Employee,
  Escalation,
  Insight,
  Location,
  QuizRecord,
  ReminderSettings,
  StatTile,
  Task,
  TaskDetailDoc,
  VerificationCall,
  VerificationSummary,
  VerificationTurn,
} from "@/lib/types";

interface SeedTurn extends VerificationTurn {
  call_id: string;
}

interface SeedEvent {
  employee_id: string;
  channel: string;
  good: boolean;
  body: string;
  days_ago: number;
  hours_ago: number;
}

interface Seed {
  org: { id: string; name: string };
  locations: Location[];
  employees: Employee[];
  quiz_records: QuizRecord[];
  events: SeedEvent[];
  tasks: (Task & { detail?: TaskDetailDoc })[];
  briefing: Briefing;
  stat_tiles: StatTile[];
  insights: Insight[];
  verification: VerificationSummary;
  escalations: Escalation[];
  verification_calls: VerificationCall[];
  verification_turns: SeedTurn[];
  phones: Record<string, string>;
  reminder_settings: Omit<ReminderSettings, "org_id">;
}

export const seed = seedJson as unknown as Seed;
