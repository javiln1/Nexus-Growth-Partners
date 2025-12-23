import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "../dashboard/_components/DashboardHome";

// Demo client ID - hardcoded for public access
const DEMO_CLIENT_ID = "ee172441-98e5-4bb4-8512-c698686a56d7";

export default async function DemoPage() {
  const supabase = await createClient();

  // Get client name
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", DEMO_CLIENT_ID)
    .single();

  return (
    <DashboardHome
      userName="Demo User"
      clientId={DEMO_CLIENT_ID}
      clientName={client?.name || "Demo Dashboard"}
      isDemo={true}
    />
  );
}
