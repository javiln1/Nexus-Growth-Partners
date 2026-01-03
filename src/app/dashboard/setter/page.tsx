import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { SetterPersonalDashboard } from "../_components/SetterPersonalDashboard";
import { getThirtyDaysAgo, getSixtyDaysAgo, getThirtyOneDaysAgo } from "@/lib/utils";
import { getUserGoal } from "@/lib/actions/goals";

export default async function SetterPage() {
  const user = await getAuthenticatedUser();

  // Only setters and executives can access this page
  if (user.role !== "setter" && user.role !== "executive") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();
  const sixtyDaysAgo = getSixtyDaysAgo();
  const thirtyOneDaysAgo = getThirtyOneDaysAgo();

  // Get team member info for this setter
  let setterName = user.fullName;
  let teamMemberId = user.teamMemberId;

  if (!teamMemberId) {
    // Try to find team member by email
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id, name")
      .eq("email", user.email)
      .eq("role", "Setter")
      .single();

    if (teamMember) {
      teamMemberId = teamMember.id;
      setterName = teamMember.name;
    }
  } else {
    // Get team member name
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("name")
      .eq("id", teamMemberId)
      .single();

    if (teamMember) {
      setterName = teamMember.name;
    }
  }

  // Get setter's reports for current period (last 30 days)
  const { data: reports } = await supabase
    .from("setter_reports")
    .select("*")
    .eq("team_member_id", teamMemberId)
    .gte("report_date", thirtyDaysAgo)
    .order("report_date", { ascending: false });

  // Get setter's reports for previous period (31-60 days ago)
  const { data: previousReports } = await supabase
    .from("setter_reports")
    .select("*")
    .eq("team_member_id", teamMemberId)
    .gte("report_date", sixtyDaysAgo)
    .lt("report_date", thirtyOneDaysAgo)
    .order("report_date", { ascending: false });

  // Get all setters' cash collected for ranking
  const { data: allSettersData } = await supabase
    .from("setter_reports")
    .select("team_member_id, cash_collected")
    .gte("report_date", thirtyDaysAgo);

  // Calculate rankings by cash collected
  const setterTotals = new Map<string, number>();
  allSettersData?.forEach((r) => {
    if (r.team_member_id) {
      const current = setterTotals.get(r.team_member_id) || 0;
      setterTotals.set(r.team_member_id, current + (r.cash_collected || 0));
    }
  });

  const sortedSetters = Array.from(setterTotals.entries())
    .sort((a, b) => b[1] - a[1]);

  const rank = teamMemberId
    ? sortedSetters.findIndex(([id]) => id === teamMemberId) + 1
    : 0;

  // Get user's saved goal
  const savedGoal = await getUserGoal(user.id, "monthly");

  // Get booking outcomes for this setter (calls they booked and what happened)
  const { data: bookingOutcomes } = await supabase
    .from("scheduled_calls")
    .select("id, status, closed, cash_amount, call_date")
    .eq("setter_id", teamMemberId)
    .gte("call_date", thirtyDaysAgo)
    .order("call_date", { ascending: false });

  return (
    <SetterPersonalDashboard
      userId={user.id}
      userName={user.fullName}
      setterName={setterName}
      reports={reports || []}
      previousReports={previousReports || []}
      rank={rank}
      totalSetters={sortedSetters.length}
      savedGoal={savedGoal}
      bookingOutcomes={bookingOutcomes || []}
    />
  );
}
