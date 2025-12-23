import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "executive" | "client" | "setter" | "closer";

// Emails that have executive access to all client dashboards
export const EXECUTIVE_EMAILS = [
  "javier@nexusgrowthpartner.co",
  "jay@nexusgrowthpartner.co",
];

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  clientId: string | null;
  teamMemberId: string | null;
}

/**
 * Get the authenticated user with their role and permissions.
 * Redirects to /login if not authenticated.
 *
 * Role detection order:
 * 1. Email in EXECUTIVE_EMAILS → executive
 * 2. Profile role field → setter/closer/client
 * 3. Default → client
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email || "";

  // Check if executive by email
  if (EXECUTIVE_EMAILS.includes(email.toLowerCase())) {
    // Get profile for name, but don't require client_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name, client_id")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email,
      role: "executive",
      fullName: profile?.full_name || email,
      clientId: profile?.client_id || null,
      teamMemberId: null,
    };
  }

  // Get full profile for non-executives
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("full_name, client_id, role, team_member_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Profile error:", profileError);
    redirect("/login");
  }

  // Determine role from profile
  let role: UserRole = "client";
  if (profile.role === "setter" || profile.role === "closer") {
    role = profile.role;
  }

  return {
    id: user.id,
    email,
    role,
    fullName: profile.full_name || email,
    clientId: profile.client_id,
    teamMemberId: profile.team_member_id || null,
  };
}

/**
 * Get all clients for executive users.
 * Returns empty array for non-executives.
 */
export async function getAllClientsForExecutive(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");

  return clients || [];
}

/**
 * Check if user has access to a specific client's data.
 */
export function canAccessClient(user: AuthenticatedUser, clientId: string): boolean {
  if (user.role === "executive") {
    return true; // Executives can access all clients
  }
  return user.clientId === clientId;
}

/**
 * Check if user can edit data (not view-only).
 */
export function canEdit(user: AuthenticatedUser): boolean {
  return user.role === "executive";
}
