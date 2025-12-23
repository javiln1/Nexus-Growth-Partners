import { createClient } from "@/lib/supabase/server";
import { VSLPaidDashboard } from "../../dashboard/_components/VSLPaidDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

const DEMO_CLIENT_ID = "ee172441-98e5-4bb4-8512-c698686a56d7";

export default async function DemoVSLPaidPage() {
  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();

  const { data: reports } = await supabase
    .from("vsl_funnel_reports")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID)
    .eq("funnel_type", "paid")
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  return (
    <VSLPaidDashboard
      userName="Demo User"
      clientId={DEMO_CLIENT_ID}
      clientName="Demo Dashboard"
      isDemo={true}
      initialReports={reports || []}
    />
  );
}
