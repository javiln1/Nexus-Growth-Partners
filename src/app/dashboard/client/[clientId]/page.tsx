import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "../../_components/DashboardHome";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDashboardPage({ params }: Props) {
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

  return (
    <DashboardHome
      userName={user.fullName}
      clientId={clientId}
      clientName={client.name}
      isExecutive={true}
    />
  );
}
