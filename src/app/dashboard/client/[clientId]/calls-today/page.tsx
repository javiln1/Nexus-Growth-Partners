import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { CallsTodayDashboard } from "../../../_components/CallsTodayDashboard";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientCallsTodayPage({ params }: Props) {
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

  // Get today's calls
  const today = new Date().toISOString().split("T")[0];
  const { data: calls } = await supabase
    .from("scheduled_calls")
    .select("*")
    .eq("client_id", clientId)
    .eq("call_date", today)
    .order("call_time", { ascending: true });

  return (
    <CallsTodayDashboard
      userName={user.fullName}
      clientId={clientId}
      clientName={client.name}
      isExecutive={true}
      initialCalls={calls || []}
    />
  );
}
