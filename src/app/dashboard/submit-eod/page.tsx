import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { EODSubmitForm } from "../_components/EODSubmitForm";

export default async function SubmitEODPage() {
  const user = await getAuthenticatedUser();

  // Only setters and closers can submit EOD reports
  if (user.role !== "setter" && user.role !== "closer") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get team member info for this user
  let teamMemberName = user.fullName;
  let teamMemberId = user.teamMemberId;
  let clientId: string | null = null;

  if (!teamMemberId) {
    // Try to find team member by email
    const roleDb = user.role === "setter" ? "Setter" : "Closer";
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id, name, client_id")
      .eq("email", user.email)
      .eq("role", roleDb)
      .single();

    if (teamMember) {
      teamMemberId = teamMember.id;
      teamMemberName = teamMember.name;
      clientId = teamMember.client_id;
    }
  } else {
    // Get team member details
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("name, client_id")
      .eq("id", teamMemberId)
      .single();

    if (teamMember) {
      teamMemberName = teamMember.name;
      clientId = teamMember.client_id;
    }
  }

  // Fallback to user's clientId if not found from team member
  if (!clientId && user.clientId) {
    clientId = user.clientId;
  }

  if (!clientId) {
    // Cannot submit without a client association
    redirect("/dashboard");
  }

  return (
    <EODSubmitForm
      userName={user.fullName}
      role={user.role as "setter" | "closer"}
      teamMemberName={teamMemberName}
      teamMemberId={teamMemberId}
      clientId={clientId}
    />
  );
}
