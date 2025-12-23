import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { VSLPaidDashboard } from "../../../_components/VSLPaidDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientVSLPaidPage({ params }: Props) {
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

  // Get initial data (last 30 days)
  const thirtyDaysAgo = getThirtyDaysAgo();

  const { data: reports } = await supabase
    .from("vsl_funnel_reports")
    .select("*")
    .eq("client_id", clientId)
    .eq("funnel_type", "paid")
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  return (
    <VSLPaidDashboard
      userName={user.fullName}
      clientId={clientId}
      clientName={client.name}
      isExecutive={true}
      initialReports={reports || []}
    />
  );
}
