import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { CloserPersonalDashboard } from "../_components/CloserPersonalDashboard";
import { getThirtyDaysAgo, getSixtyDaysAgo, getThirtyOneDaysAgo, getToday } from "@/lib/utils";
import { getUserGoal } from "@/lib/actions/goals";

export default async function CloserPersonalPage() {
  const user = await getAuthenticatedUser();

  // Only closers and executives can access this page
  if (user.role !== "closer" && user.role !== "executive") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();
  const sixtyDaysAgo = getSixtyDaysAgo();
  const thirtyOneDaysAgo = getThirtyOneDaysAgo();

  // Get team member info for this closer
  let closerName = user.fullName;
  let teamMemberId = user.teamMemberId;
  let clientId: string | null = null;

  if (!teamMemberId) {
    // Try to find team member by email
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id, name, client_id")
      .eq("email", user.email)
      .eq("role", "Closer")
      .single();

    if (teamMember) {
      teamMemberId = teamMember.id;
      closerName = teamMember.name;
      clientId = teamMember.client_id;
    }
  } else {
    // Get team member name and client_id
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("name, client_id")
      .eq("id", teamMemberId)
      .single();

    if (teamMember) {
      closerName = teamMember.name;
      clientId = teamMember.client_id;
    }
  }

  // Fetch today's calls for this closer
  const todayDate = getToday();
  const { data: todayCalls } = await supabase
    .from("scheduled_calls")
    .select("*")
    .eq("closer_name", closerName)
    .eq("call_date", todayDate)
    .order("call_time", { ascending: true });

  // Get closer's reports for current period (last 30 days)
  const { data: reports } = await supabase
    .from("closer_reports")
    .select("*")
    .eq("team_member_id", teamMemberId)
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  // Get closer's reports for previous period (31-60 days ago)
  const { data: previousReports } = await supabase
    .from("closer_reports")
    .select("*")
    .eq("team_member_id", teamMemberId)
    .gte("report_date", sixtyDaysAgo)
    .lt("report_date", thirtyOneDaysAgo)
    .order("report_date", { ascending: false });

  // Get all closers' cash collected for ranking
  const { data: allClosersData } = await supabase
    .from("closer_reports")
    .select("team_member_id, cash_collected")
    .gte("report_date", thirtyDaysAgo);

  // Calculate rankings by cash collected
  const closerTotals = new Map<string, number>();
  allClosersData?.forEach((r) => {
    if (r.team_member_id) {
      const current = closerTotals.get(r.team_member_id) || 0;
      closerTotals.set(r.team_member_id, current + (r.cash_collected || 0));
    }
  });

  const sortedClosers = Array.from(closerTotals.entries())
    .sort((a, b) => b[1] - a[1]);

  const rank = teamMemberId
    ? sortedClosers.findIndex(([id]) => id === teamMemberId) + 1
    : 0;

  // Get user's saved goal
  const savedGoal = await getUserGoal(user.id, "monthly");

  return (
    <CloserPersonalDashboard
      userId={user.id}
      userName={user.fullName}
      closerName={closerName}
      clientId={clientId || ""}
      reports={reports || []}
      previousReports={previousReports || []}
      rank={rank}
      totalClosers={sortedClosers.length}
      savedGoal={savedGoal}
      todayCalls={todayCalls || []}
    />
  );
}
