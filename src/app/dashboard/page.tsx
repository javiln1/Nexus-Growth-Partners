import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHome } from "./_components/DashboardHome";

export default async function DashboardPage() {
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

  return (
    <DashboardHome
      userName={profile.full_name || user.email || "User"}
    />
  );
}
