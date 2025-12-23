import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CallsTodayDashboard } from "../_components/CallsTodayDashboard";

export default async function CallsTodayPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("client_id, full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.client_id) {
    console.error("Profile error:", profileError);
    redirect("/login");
  }

  // Get today's calls
  const today = new Date().toISOString().split("T")[0];
  const { data: calls } = await supabase
    .from("scheduled_calls")
    .select("*")
    .eq("client_id", profile.client_id)
    .eq("call_date", today)
    .order("call_time", { ascending: true });

  return (
    <CallsTodayDashboard
      userName={profile.full_name || user.email || "User"}
      clientId={profile.client_id}
      initialCalls={calls || []}
    />
  );
}
