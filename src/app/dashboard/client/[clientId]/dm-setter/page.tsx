import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { DMSetterDashboard } from "../../../_components/DMSetterDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDMSetterPage({ params }: Props) {
  const { clientId } = await params;
  const user = await getAuthenticatedUser();

  // Only executives can access other client dashboards
  if (user.role !== "executive") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get client name
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  if (!client) {
    redirect("/dashboard");
  }

  const thirtyDaysAgo = getThirtyDaysAgo();

  // Get team members
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("client_id", clientId)
    .eq("active", true)
    .order("name");

  // Get setter reports (includes DM metrics from EOD reports)
  const { data: reports } = await supabase
    .from("setter_reports")
    .select("*")
    .eq("client_id", clientId)
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  return (
    <DMSetterDashboard
      userName={user.fullName}
      clientId={clientId}
      clientName={client.name}
      isExecutive={true}
      teamMembers={teamMembers || []}
      initialReports={reports || []}
    />
  );
}
