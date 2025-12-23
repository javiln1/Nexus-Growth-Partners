import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VSLOrganicDashboard } from "../_components/VSLOrganicDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

export default async function VSLOrganicPage() {
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

  // Fetch funnel reports
  const { data: reports } = await supabase
    .from("vsl_funnel_reports")
    .select("*")
    .eq("client_id", profile.client_id)
    .eq("funnel_type", "organic")
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  // Fetch content performance data
  const { data: contentData } = await supabase
    .from("vsl_organic_content")
    .select("*")
    .eq("client_id", profile.client_id)
    .gte("report_date", thirtyDaysAgo);

  return (
    <VSLOrganicDashboard
      userName={profile.full_name || user.email || "User"}
      clientId={profile.client_id}
      initialReports={reports || []}
      initialContentData={contentData || []}
    />
  );
}
