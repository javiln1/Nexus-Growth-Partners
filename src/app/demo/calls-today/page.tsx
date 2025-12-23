import { createClient } from "@/lib/supabase/server";
import { CallsTodayDashboard } from "../../dashboard/_components/CallsTodayDashboard";

const DEMO_CLIENT_ID = "ee172441-98e5-4bb4-8512-c698686a56d7";

export default async function DemoCallsTodayPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const { data: calls } = await supabase
    .from("scheduled_calls")
    .select("*")
    .eq("client_id", DEMO_CLIENT_ID)
    .eq("call_date", today)
    .order("call_time", { ascending: true });

  return (
    <CallsTodayDashboard
      userName="Demo User"
      clientId={DEMO_CLIENT_ID}
      clientName="Demo Dashboard"
      isDemo={true}
      initialCalls={calls || []}
    />
  );
}
