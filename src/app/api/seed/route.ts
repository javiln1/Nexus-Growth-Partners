import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's client_id
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) {
    return NextResponse.json({ error: "No client found" }, { status: 400 });
  }

  const clientId = profile.client_id;
  const reports = [];
  const today = new Date();

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
    const followUps = Math.floor(shows * (0.2 + Math.random() * 0.15)); // ~20-35% of shows go to follow-up
    const dealsLost = shows - closes - followUps;
    const cashPerDeal = 4000 + Math.random() * 2000;
    const cashCollected = closes * cashPerDeal;
    const revenue = cashCollected * 1.5;
    const adSpend = 3500 + Math.random() * 2000;

    reports.push({
      client_id: clientId,
      report_date: dateStr,
      funnel_type: "paid" as const,
      page_views: pageViews,
      applications,
      qualified,
      bookings,
      shows,
      no_shows: noShows,
      closes,
      deals_lost: Math.max(0, dealsLost),
      follow_ups: followUps,
      cash_collected: Math.round(cashCollected),
      revenue: Math.round(revenue),
      ad_spend: Math.round(adSpend),
    });
  }

  // Upsert to avoid duplicates
  const { error } = await supabase
    .from("vsl_funnel_reports")
    .upsert(reports, { onConflict: "client_id,report_date,funnel_type" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate ad performance breakdown data
  const campaigns = [
    { name: "Summer Sale 2024", adsets: ["Lookalike - US", "Interest - Business", "Retargeting"] },
    { name: "Black Friday", adsets: ["Cold - Broad", "Warm - Engagers"] },
    { name: "Evergreen VSL", adsets: ["Lookalike - Buyers", "Interest - Entrepreneurs"] },
  ];

  const ads = ["Video 1 - Testimonial", "Video 2 - Case Study", "Image 1 - Results", "Carousel - Benefits"];

  const adPerformanceData = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Generate data for each campaign/adset/ad combo
    for (const campaign of campaigns) {
      for (const adset of campaign.adsets) {
        for (const ad of ads) {
          // Randomize with some campaigns performing better
          const performanceMultiplier =
            campaign.name === "Summer Sale 2024" ? 1.2 :
            campaign.name === "Evergreen VSL" ? 1.0 : 0.8;

          const adsetMultiplier =
            adset.includes("Lookalike") ? 1.3 :
            adset.includes("Retargeting") ? 1.5 : 1.0;

          const adMultiplier =
            ad.includes("Video 1") ? 1.2 :
            ad.includes("Video 2") ? 1.1 : 0.9;

          const baseSpend = 50 + Math.random() * 100;
          const spend = baseSpend * performanceMultiplier;
          const pageViews = Math.floor(spend * (8 + Math.random() * 4));
          const applications = Math.floor(pageViews * (0.04 + Math.random() * 0.02) * adsetMultiplier);
          const qualified = Math.floor(applications * (0.5 + Math.random() * 0.2));
          const bookings = Math.floor(qualified * (0.5 + Math.random() * 0.2));
          const shows = Math.floor(bookings * (0.7 + Math.random() * 0.15));
          const closes = Math.floor(shows * (0.3 + Math.random() * 0.2) * adMultiplier);
          const cashPerDeal = 4000 + Math.random() * 2000;
          const cashCollected = closes * cashPerDeal;
          const revenue = cashCollected * 1.5;

          adPerformanceData.push({
            client_id: clientId,
            report_date: dateStr,
            campaign_name: campaign.name,
            adset_name: adset,
            ad_name: ad,
            ad_spend: Math.round(spend * 100) / 100,
            page_views: pageViews,
            applications,
            qualified,
            bookings,
            shows,
            closes,
            cash_collected: Math.round(cashCollected),
            revenue: Math.round(revenue),
          });
        }
      }
    }
  }

  // Upsert ad performance data
  const { error: adError } = await supabase
    .from("vsl_ad_performance")
    .upsert(adPerformanceData, {
      onConflict: "client_id,report_date,campaign_name,adset_name,ad_name"
    });

  if (adError) {
    console.error("Ad performance error:", adError);
    // Don't fail the whole request if ad table doesn't exist yet
  }

  return NextResponse.json({
    success: true,
    count: reports.length,
    adPerformanceCount: adPerformanceData.length
  });
}
