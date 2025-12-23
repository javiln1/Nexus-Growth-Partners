// Script to seed VSL funnel sample data
// Run with: npx tsx scripts/seed-vsl-data.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xloveeduuwqagntcdxwf.supabase.co";
// You'll need to add your service_role key here or as env variable
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.error("Please set SUPABASE_SERVICE_ROLE_KEY environment variable");
  console.log("You can find this in your Supabase dashboard under Settings > API");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const clientId = "b3755b5f-cd0f-49d4-829c-47bc05892874"; // 7 Figure Shops

async function seedData() {
  const today = new Date();
  const reports = [];

  // Generate 30 days of sample data
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Randomize metrics with realistic variance
    const pageViews = Math.floor(800 + Math.random() * 400);
    const applications = Math.floor(pageViews * (0.04 + Math.random() * 0.02));
    const qualified = Math.floor(applications * (0.55 + Math.random() * 0.15));
    const bookings = Math.floor(qualified * (0.6 + Math.random() * 0.15));
    const shows = Math.floor(bookings * (0.7 + Math.random() * 0.15));
    const noShows = bookings - shows;
    const closes = Math.floor(shows * (0.4 + Math.random() * 0.2));
    const dealsLost = shows - closes;
    const cashPerDeal = 4000 + Math.random() * 2000;
    const cashCollected = closes * cashPerDeal;
    const revenue = cashCollected * 1.5;
    const adSpend = 3500 + Math.random() * 2000;

    reports.push({
      client_id: clientId,
      report_date: dateStr,
      funnel_type: "paid",
      page_views: pageViews,
      applications: applications,
      qualified: qualified,
      bookings: bookings,
      shows: shows,
      no_shows: noShows,
      closes: closes,
      deals_lost: dealsLost,
      cash_collected: Math.round(cashCollected),
      revenue: Math.round(revenue),
      ad_spend: Math.round(adSpend),
    });
  }

  console.log(`Inserting ${reports.length} reports...`);

  const { data, error } = await supabase
    .from("vsl_funnel_reports")
    .upsert(reports, { onConflict: "client_id,report_date,funnel_type" });

  if (error) {
    console.error("Error inserting data:", error);
  } else {
    console.log("Successfully inserted sample data!");
  }
}

seedData();
