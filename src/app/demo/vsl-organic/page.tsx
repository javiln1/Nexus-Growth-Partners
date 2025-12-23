import { createClient } from "@/lib/supabase/server";
import { VSLOrganicDashboard } from "../../dashboard/_components/VSLOrganicDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

const DEMO_CLIENT_ID = "ee172441-98e5-4bb4-8512-c698686a56d7";

export default async function DemoVSLOrganicPage() {
  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();

  const { data: reports } = await supabase
    .from("vsl_funnel_reports")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID)
    .eq("funnel_type", "organic")
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  const { data: contentData } = await supabase
    .from("vsl_organic_content")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID)
    .gte("report_date", thirtyDaysAgo);

  return (
    <VSLOrganicDashboard
      userName="Demo User"
      clientId={DEMO_CLIENT_ID}
      clientName="Demo Dashboard"
      isDemo={true}
      initialReports={reports || []}
      initialContentData={contentData || []}
    />
  );
}
