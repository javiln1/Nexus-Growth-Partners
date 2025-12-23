import { createClient } from "@/lib/supabase/server";
import { CloserFunnelDashboard } from "../../dashboard/_components/CloserFunnelDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

const DEMO_CLIENT_ID = "ee172441-98e5-4bb4-8512-c698686a56d7";

export default async function DemoCloserPage() {
  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID)
    .eq("active", true)
    .order("name");

  const { data: reports } = await supabase
    .from("closer_reports")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID)
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  return (
    <CloserFunnelDashboard
      userName="Demo User"
      clientId={DEMO_CLIENT_ID}
      clientName="Demo Dashboard"
      isDemo={true}
      teamMembers={teamMembers || []}
      initialReports={reports || []}
    />
  );
}
