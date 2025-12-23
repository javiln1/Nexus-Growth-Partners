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
  const contentData = [];
  const today = new Date();

  // Organic content sources with realistic distributions
  const sources = [
    { name: "Instagram", mediums: ["Bio", "Post", "Reel", "Story"] },
    { name: "YouTube", mediums: ["Video", "Short", "Community"] },
    { name: "LinkedIn", mediums: ["Post", "Article", "Bio"] },
    { name: "TikTok", mediums: ["Video", "Bio"] },
    { name: "Twitter", mediums: ["Tweet", "Bio", "Thread"] },
  ];

  const contentNames = [
    "How I Scaled to $100K/mo",
    "Client Success Story",
    "Behind the Scenes",
    "Free Training Announcement",
    "Case Study Results",
    "Q&A Session",
    "Weekly Tips",
    "Transformation Story",
  ];

  // Generate 30 days of sample funnel data
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Randomize metrics with realistic variance for organic
    const pageViews = Math.floor(200 + Math.random() * 150);
    const applications = Math.floor(pageViews * (0.03 + Math.random() * 0.02));
    const qualified = Math.floor(applications * (0.5 + Math.random() * 0.2));
    const bookings = Math.floor(qualified * (0.55 + Math.random() * 0.2));
    const shows = Math.floor(bookings * (0.65 + Math.random() * 0.2));
    const noShows = bookings - shows;
    const closes = Math.floor(shows * (0.35 + Math.random() * 0.2));
    const followUps = Math.floor(shows * (0.2 + Math.random() * 0.15));
    const dealsLost = Math.max(0, shows - closes - followUps);
    const cashPerDeal = 4000 + Math.random() * 2000;
    const cashCollected = closes * cashPerDeal;
    const revenue = cashCollected * 1.5;

    reports.push({
      client_id: clientId,
      report_date: dateStr,
      funnel_type: "organic" as const,
      page_views: pageViews,
      applications,
      qualified,
      bookings,
      shows,
      no_shows: noShows,
      closes,
      deals_lost: dealsLost,
      follow_ups: followUps,
      cash_collected: Math.round(cashCollected),
      revenue: Math.round(revenue),
      ad_spend: null, // No ad spend for organic
    });
  }

  // Upsert funnel reports
  const { error } = await supabase
    .from("vsl_funnel_reports")
    .upsert(reports, { onConflict: "client_id,report_date,funnel_type" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate content performance data
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Generate data for each source/medium/content combo
    for (const source of sources) {
      for (const medium of source.mediums) {
        // Pick 2-3 random content names for each medium
        const numContent = 2 + Math.floor(Math.random() * 2);
        const shuffled = [...contentNames].sort(() => Math.random() - 0.5);
        const selectedContent = shuffled.slice(0, numContent);

        for (const contentName of selectedContent) {
          // Different platforms perform differently
          const platformMultiplier =
            source.name === "Instagram" ? 1.3 :
            source.name === "YouTube" ? 1.5 :
            source.name === "LinkedIn" ? 0.9 :
            source.name === "TikTok" ? 1.1 : 0.8;

          // Different placements perform differently
          const mediumMultiplier =
            medium === "Bio" ? 0.5 :
            medium === "Video" || medium === "Reel" ? 1.4 :
            medium === "Post" ? 1.0 : 0.7;

          const baseViews = 20 + Math.random() * 40;
          const pageViews = Math.floor(baseViews * platformMultiplier * mediumMultiplier);
          const applications = Math.floor(pageViews * (0.03 + Math.random() * 0.02));
          const qualified = Math.floor(applications * (0.5 + Math.random() * 0.2));
          const bookings = Math.floor(qualified * (0.5 + Math.random() * 0.2));
          const shows = Math.floor(bookings * (0.65 + Math.random() * 0.2));
          const closes = Math.floor(shows * (0.3 + Math.random() * 0.2));
          const cashPerDeal = 4000 + Math.random() * 2000;
          const cashCollected = closes * cashPerDeal;
          const revenueAmount = cashCollected * 1.5;

          // Only add entries with some activity
          if (pageViews > 0) {
            contentData.push({
              client_id: clientId,
              report_date: dateStr,
              source: source.name,
              medium,
              content_name: contentName,
              page_views: pageViews,
              applications,
              qualified,
              bookings,
              shows,
              closes,
              cash_collected: Math.round(cashCollected),
              revenue: Math.round(revenueAmount),
            });
          }
        }
      }
    }
  }

  // Upsert content performance data
  const { error: contentError } = await supabase
    .from("vsl_organic_content")
    .upsert(contentData, {
      onConflict: "client_id,report_date,source,medium,content_name"
    });

  if (contentError) {
    console.error("Content performance error:", contentError);
    // Don't fail if table doesn't exist yet
  }

  return NextResponse.json({
    success: true,
    funnelCount: reports.length,
    contentCount: contentData.length
  });
}
