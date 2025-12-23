import { redirect } from "next/navigation";
import { getAuthenticatedUser, getAllClientsForExecutive } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "./_components/DashboardHome";
import { ExecutiveDashboard } from "./_components/ExecutiveDashboard";

async function getExecutiveStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Fetch funnel stats (last 30 days) and today's calls in parallel
  const [funnelResult, callsResult] = await Promise.all([
    supabase
      .from("vsl_funnel_reports")
      .select("cash_collected, revenue, closes")
      .gte("report_date", thirtyDaysAgo),
    supabase
      .from("scheduled_calls")
      .select("id")
      .eq("call_date", today),
  ]);

  const totals = (funnelResult.data || []).reduce(
    (acc, row) => ({
      cashCollected: acc.cashCollected + (row.cash_collected || 0),
      revenue: acc.revenue + (row.revenue || 0),
      closes: acc.closes + (row.closes || 0),
    }),
    { cashCollected: 0, revenue: 0, closes: 0 }
  );

  return {
    ...totals,
    callsToday: callsResult.data?.length || 0,
  };
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  // Route based on role
  switch (user.role) {
    case "executive":
      // Executive sees all clients with aggregate stats
      const [clients, stats] = await Promise.all([
        getAllClientsForExecutive(),
        getExecutiveStats(),
      ]);
      return (
        <ExecutiveDashboard
          userName={user.fullName}
          clients={clients}
          stats={stats}
        />
      );

    case "setter":
      // Setters see their personal dashboard
      redirect("/dashboard/setter");

    case "closer":
      // Closers see their personal dashboard
      redirect("/dashboard/closer-personal");

    case "client":
    default:
      // Clients see their own dashboard (view-only)
      if (!user.clientId) {
        console.error("Client user has no client_id");
        redirect("/login");
      }
      return (
        <DashboardHome
          userName={user.fullName}
          clientId={user.clientId}
        />
      );
  }
}
