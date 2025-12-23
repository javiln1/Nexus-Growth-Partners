import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "../../../_components/DashboardClient";
import { getThirtyDaysAgo } from "@/lib/utils";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientEODPage({ params }: Props) {
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

  // Get team members for filter dropdown
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("client_id", clientId)
    .eq("active", true)
    .order("name");

  // Get initial data (last 30 days)
  const thirtyDaysAgo = getThirtyDaysAgo();

  const [setterResult, closerResult] = await Promise.all([
    supabase
      .from("setter_reports")
      .select("*")
      .eq("client_id", clientId)
      .gte("report_date", thirtyDaysAgo)
      .order("report_date", { ascending: false }),
    supabase
      .from("closer_reports")
      .select("*")
      .eq("client_id", clientId)
      .gte("report_date", thirtyDaysAgo)
      .order("report_date", { ascending: false }),
  ]);

  return (
    <DashboardClient
      userEmail={user.email}
      userName={user.fullName}
      clientId={clientId}
      clientName={client.name}
      isExecutive={true}
      teamMembers={teamMembers || []}
      initialSetterReports={setterResult.data || []}
      initialCloserReports={closerResult.data || []}
    />
  );
}
