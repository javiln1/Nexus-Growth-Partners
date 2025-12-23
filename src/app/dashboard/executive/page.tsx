import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExecutiveDashboard } from "../_components/ExecutiveDashboard";

export default async function ExecutivePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user is an executive
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || profile.role !== "executive") {
    redirect("/dashboard");
  }

  // Get all clients for the dropdown
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");

  return (
    <ExecutiveDashboard
      userName={profile.full_name || user.email || "Executive"}
      clients={clients || []}
    />
  );
}
