import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DEFAULT_CLOSERS = ["Alex", "Jordan", "Mike"];
const LEAD_NAMES = [
  "Sarah Johnson", "Michael Chen", "Emma Wilson", "James Brown",
  "Olivia Davis", "William Martinez", "Sophia Garcia", "Benjamin Lee",
  "Isabella Rodriguez", "Lucas Thompson", "Mia Anderson", "Henry White",
  "Charlotte Harris", "Alexander Clark", "Amelia Lewis", "Daniel Walker"
];

function getRandomTime(): string {
  const hours = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
  const minutes = Math.random() > 0.5 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

function getRandomInvestment(): { min: number; max: number; notes: string } {
  const ranges = [
    { min: 5000, max: 10000, notes: "Has savings, ready to invest" },
    { min: 10000, max: 15000, notes: "Mid-level budget, motivated" },
    { min: 15000, max: 25000, notes: "Higher budget, experienced" },
    { min: 25000, max: 50000, notes: "Premium prospect, has liquid capital" },
    { min: 3000, max: 5000, notes: "Entry level, might need financing" },
  ];
  return ranges[Math.floor(Math.random() * ranges.length)];
}

function getRandomConfirmed(): boolean | null {
  // Weighted: 40% confirmed, 45% pending, 15% declined
  const rand = Math.random();
  if (rand < 0.40) return true;
  if (rand < 0.85) return null;
  return false;
}

export async function POST() {
  const supabase = await createClient();

  // Get user and their client
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) {
    return NextResponse.json({ error: "No client found" }, { status: 400 });
  }

  const clientId = profile.client_id;

  // Get actual closers from team_members, fallback to defaults
  const { data: teamClosers } = await supabase
    .from("team_members")
    .select("name")
    .eq("client_id", clientId)
    .eq("role", "Closer")
    .eq("active", true);

  const closerNames = teamClosers && teamClosers.length > 0
    ? teamClosers.map(c => c.name)
    : DEFAULT_CLOSERS;

  // Generate calls for today and the next 7 days
  const calls = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split("T")[0];

    // Random number of calls per day (3-8)
    const numCalls = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < numCalls; i++) {
      const investment = getRandomInvestment();
      const statuses = ["scheduled", "scheduled", "scheduled", "completed", "no_show"];
      const status = dayOffset === 0 ? "scheduled" : statuses[Math.floor(Math.random() * statuses.length)];

      calls.push({
        client_id: clientId,
        call_date: dateStr,
        call_time: getRandomTime(),
        lead_name: LEAD_NAMES[Math.floor(Math.random() * LEAD_NAMES.length)],
        lead_email: `lead${Math.floor(Math.random() * 1000)}@example.com`,
        closer_name: closerNames[Math.floor(Math.random() * closerNames.length)],
        investment_min: investment.min,
        investment_max: investment.max,
        investment_notes: investment.notes,
        confirmed: getRandomConfirmed(),
        status: status,
      });
    }
  }

  // Clear existing calls for this client
  await supabase.from("scheduled_calls").delete().eq("client_id", clientId);

  // Insert new calls
  const { error } = await supabase.from("scheduled_calls").insert(calls);

  if (error) {
    console.error("Error seeding calls:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${calls.length} calls for the next 7 days`,
  });
}
