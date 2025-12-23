import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CloserFunnelDashboard } from "../_components/CloserFunnelDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

export default async function CloserPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("client_id, full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.client_id) {
    console.error("Profile error:", profileError);
    redirect("/login");
  }

  const thirtyDaysAgo = getThirtyDaysAgo();

  // Get team members
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("client_id", profile.client_id)
    .eq("active", true)
    .order("name");

  // Get closer reports
  const { data: reports } = await supabase
    .from("closer_reports")
    .select("*")
    .eq("client_id", profile.client_id)
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  return (
    <CloserFunnelDashboard
      userName={profile.full_name || user.email || "User"}
      clientId={profile.client_id}
      teamMembers={teamMembers || []}
      initialReports={reports || []}
    />
  );
}
