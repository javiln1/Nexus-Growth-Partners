import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { LeaderboardDashboard } from "../_components/LeaderboardDashboard";
import { getThirtyDaysAgo, getSixtyDaysAgo, getThirtyOneDaysAgo } from "@/lib/utils";

export default async function LeaderboardPage() {
  const user = await getAuthenticatedUser();

  // Only authenticated users can access
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();
  const sixtyDaysAgo = getSixtyDaysAgo();
  const thirtyOneDaysAgo = getThirtyOneDaysAgo();

  // Get all setters' reports for current period
  const { data: setterReports } = await supabase
    .from("setter_reports")
    .select("team_member_id, member_name, cash_collected, conversations, calls_booked_dms, calls_booked_dials")
    .gte("report_date", thirtyDaysAgo);

  // Get all setters' reports for previous period
  const { data: prevSetterReports } = await supabase
    .from("setter_reports")
    .select("team_member_id, cash_collected")
    .gte("report_date", sixtyDaysAgo)
    .lt("report_date", thirtyOneDaysAgo);

  // Get all closers' reports for current period
  const { data: closerReports } = await supabase
    .from("closer_reports")
    .select("team_member_id, member_name, cash_collected, shows, deals_closed")
    .gte("report_date", thirtyDaysAgo);

  // Get all closers' reports for previous period
  const { data: prevCloserReports } = await supabase
    .from("closer_reports")
    .select("team_member_id, cash_collected")
    .gte("report_date", sixtyDaysAgo)
    .lt("report_date", thirtyOneDaysAgo);

  // Aggregate setter data
  const setterTotals = new Map<string, { name: string; cash: number; bookings: number; convos: number; prevCash: number }>();

  setterReports?.forEach((r) => {
    if (r.team_member_id) {
      const current = setterTotals.get(r.team_member_id) || { name: r.member_name, cash: 0, bookings: 0, convos: 0, prevCash: 0 };
      current.cash += r.cash_collected || 0;
      current.bookings += (r.calls_booked_dms || 0) + (r.calls_booked_dials || 0);
      current.convos += r.conversations || 0;
      setterTotals.set(r.team_member_id, current);
    }
  });

  prevSetterReports?.forEach((r) => {
    if (r.team_member_id && setterTotals.has(r.team_member_id)) {
      const current = setterTotals.get(r.team_member_id)!;
      current.prevCash += r.cash_collected || 0;
    }
  });

  // Aggregate closer data
  const closerTotals = new Map<string, { name: string; cash: number; deals: number; shows: number; prevCash: number }>();

  closerReports?.forEach((r) => {
    if (r.team_member_id) {
      const current = closerTotals.get(r.team_member_id) || { name: r.member_name, cash: 0, deals: 0, shows: 0, prevCash: 0 };
      current.cash += r.cash_collected || 0;
      current.deals += r.deals_closed || 0;
      current.shows += r.shows || 0;
      closerTotals.set(r.team_member_id, current);
    }
  });

  prevCloserReports?.forEach((r) => {
    if (r.team_member_id && closerTotals.has(r.team_member_id)) {
      const current = closerTotals.get(r.team_member_id)!;
      current.prevCash += r.cash_collected || 0;
    }
  });

  // Convert to arrays and sort by cash
  const setterLeaderboard = Array.from(setterTotals.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.cash - a.cash);

  const closerLeaderboard = Array.from(closerTotals.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.cash - a.cash);

  return (
    <LeaderboardDashboard
      userName={user.fullName}
      setterLeaderboard={setterLeaderboard}
      closerLeaderboard={closerLeaderboard}
      currentUserId={user.teamMemberId}
    />
  );
}
