import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VSLPaidDashboard } from "../_components/VSLPaidDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

export default async function VSLPaidPage() {
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

  // Get initial data (last 30 days)
  const thirtyDaysAgo = getThirtyDaysAgo();

  const { data: reports } = await supabase
    .from("vsl_funnel_reports")
    .select("*")
    .eq("client_id", profile.client_id)
    .eq("funnel_type", "paid")
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  return (
    <VSLPaidDashboard
      userName={profile.full_name || user.email || "User"}
      clientId={profile.client_id}
      initialReports={reports || []}
    />
  );
}
