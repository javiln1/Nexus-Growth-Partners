import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "../_components/DashboardClient";
import { getThirtyDaysAgo } from "@/lib/utils";

export default async function EODTrackerPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with client_id
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("client_id, full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.client_id) {
    console.error("Profile error:", profileError);
    redirect("/login");
  }

  // Get team members for filter dropdown
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("client_id", profile.client_id)
    .eq("active", true)
    .order("name");

  // Get initial data (last 30 days)
  const thirtyDaysAgo = getThirtyDaysAgo();

  const [setterResult, closerResult] = await Promise.all([
    supabase
      .from("setter_reports")
      .select("*")
      .eq("client_id", profile.client_id)
      .gte("report_date", thirtyDaysAgo)
      .order("report_date", { ascending: false }),
    supabase
      .from("closer_reports")
      .select("*")
      .eq("client_id", profile.client_id)
      .gte("report_date", thirtyDaysAgo)
      .order("report_date", { ascending: false }),
  ]);

  return (
    <DashboardClient
      userEmail={user.email || ""}
      userName={profile.full_name || user.email || "User"}
      clientId={profile.client_id}
      teamMembers={teamMembers || []}
      initialSetterReports={setterResult.data || []}
      initialCloserReports={closerResult.data || []}
    />
  );
}
