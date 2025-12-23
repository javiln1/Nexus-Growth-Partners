import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "../../dashboard/_components/DashboardClient";
import { getThirtyDaysAgo } from "@/lib/utils";

const DEMO_CLIENT_ID = "ee172441-98e5-4bb4-8512-c698686a56d7";

export default async function DemoEODPage() {
  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();

  // Get team members
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID)
    .eq("active", true)
    .order("name");

  const [setterResult, closerResult] = await Promise.all([
    supabase
      .from("setter_reports")
      .select("*")
      .eq("client_id", DEMO_CLIENT_ID)
      .gte("report_date", thirtyDaysAgo)
      .order("report_date", { ascending: false }),
    supabase
      .from("closer_reports")
      .select("*")
      .eq("client_id", DEMO_CLIENT_ID)
      .gte("report_date", thirtyDaysAgo)
      .order("report_date", { ascending: false }),
  ]);

  return (
    <DashboardClient
      userEmail="demo@example.com"
      userName="Demo User"
      clientId={DEMO_CLIENT_ID}
      clientName="Demo Dashboard"
      isDemo={true}
      teamMembers={teamMembers || []}
      initialSetterReports={setterResult.data || []}
      initialCloserReports={closerResult.data || []}
    />
  );
}
