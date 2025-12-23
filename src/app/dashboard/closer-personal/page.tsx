import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { CloserPersonalDashboard } from "../_components/CloserPersonalDashboard";
import { getThirtyDaysAgo } from "@/lib/utils";

export default async function CloserPersonalPage() {
  const user = await getAuthenticatedUser();

  // Only closers and executives can access this page
  if (user.role !== "closer" && user.role !== "executive") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();

  // Get team member info for this closer
  let closerName = user.fullName;
  let teamMemberId = user.teamMemberId;

  if (!teamMemberId) {
    // Try to find team member by email
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id, name")
      .eq("email", user.email)
      .eq("role", "Closer")
      .single();

    if (teamMember) {
      teamMemberId = teamMember.id;
      closerName = teamMember.name;
    }
  } else {
    // Get team member name
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("name")
      .eq("id", teamMemberId)
      .single();

    if (teamMember) {
      closerName = teamMember.name;
    }
  }

  // Get closer's reports
  const { data: reports } = await supabase
    .from("closer_reports")
    .select("*")
    .eq("team_member_id", teamMemberId)
    .gte("report_date", thirtyDaysAgo)
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

  return (
    <CloserPersonalDashboard
      userName={user.fullName}
      closerName={closerName}
      reports={reports || []}
      rank={rank}
      totalClosers={sortedClosers.length}
    />
  );
}
