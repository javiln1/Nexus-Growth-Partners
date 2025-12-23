// Database types for Supabase tables

export type UserRole = "executive" | "client" | "setter" | "closer";

export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  client_id: string | null;
  full_name: string | null;
  role: UserRole;
  team_member_id: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  client_id: string;
  name: string;
  role: "Setter" | "Closer";
  email: string | null;
  active: boolean;
  created_at: string;
}

export interface SetterReport {
  id: string;
  client_id: string;
  team_member_id: string | null;
  member_name: string;
  report_date: string;
  // Activity Metrics
  dials: number;
  leads_texted: number;
  outbound_dms_sent: number;
  pickups: number;
  text_responses: number;
  outbound_dm_responses: number;
  inbound_dms: number;
  conversations: number;
  followups_sent: number;
  // Booking Metrics
  calls_booked_dials: number;
  calls_booked_dms: number;
  live_transfers: number;
  // Recovery Metrics
  noshows_reached: number;
  noshows_rebooked: number;
  old_applicants_called: number;
  old_applicants_rebooked: number;
  cancellations_called: number;
  cancellations_rebooked: number;
  // Revenue
  cash_collected: number;
  revenue_generated: number;
  // Qualitative
  key_wins: string | null;
  main_challenges: string | null;
  improvements: string | null;
  // Metadata
  typeform_response_id: string | null;
  created_at: string;
}

export interface CloserReport {
  id: string;
  client_id: string;
  team_member_id: string | null;
  member_name: string;
  report_date: string;
  // Call Metrics
  calls_on_calendar: number;
  shows: number;
  no_shows: number;
  reschedules: number;
  followups_booked: number;
  // Pipeline Metrics
  deals_dqd: number;
  hot_prospects: number;
  warm_prospects: number;
  // Qualitative Call Data
  primary_objections: string | null;
  call_types: string | null;
  // Revenue
  deals_closed: number;
  cash_collected: number;
  revenue_generated: number;
  // Qualitative
  key_wins: string | null;
  main_challenges: string | null;
  improvements: string | null;
  // Metadata
  typeform_response_id: string | null;
  created_at: string;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  memberId: string;
  role: "all" | "Setter" | "Closer";
}

// VSL Funnel Report (Paid & Organic)
export interface VSLFunnelReport {
  id: string;
  client_id: string;
  report_date: string;
  funnel_type: "paid" | "organic";
  // Funnel Stages
  page_views: number;
  applications: number;
  qualified: number;
  bookings: number;
  shows: number;
  no_shows: number;
  closes: number;
  deals_lost: number;
  follow_ups: number;
  // Financial
  cash_collected: number;
  revenue: number;
  ad_spend: number | null; // Only for paid
  // Metadata
  created_at: string;
}

// DM Setter Funnel Report
export interface DMSetterFunnelReport {
  id: string;
  client_id: string;
  team_member_id: string | null;
  member_name: string;
  report_date: string;
  // Funnel Stages
  dms_sent: number;
  responses: number;
  conversations: number;
  bookings: number;
  shows: number;
  no_shows: number;
  closes: number;
  deals_lost: number;
  // Financial
  cash_collected: number;
  revenue: number;
  // Metadata
  created_at: string;
}

// VSL Funnel Stats
export interface VSLFunnelStats {
  period: {
    adSpend: number;
    pageViews: number;
    applications: number;
    qualified: number;
    bookings: number;
    shows: number;
    noShows: number;
    closes: number;
    dealsLost: number;
    followUps: number;
    cashCollected: number;
    revenue: number;
  };
  rates: {
    viewToApp: number;
    appToQualified: number;
    qualifiedToBooking: number;
    bookingToShow: number;
    showToClose: number;
  };
  costs: {
    costPerView: number;
    costPerApp: number;
    costPerQualified: number;
    costPerBooking: number;
    costPerShow: number;
    costPerClose: number;
  };
  roas: {
    revenueRoas: number;
    cashRoas: number;
  };
}

// DM Funnel Stats
export interface DMFunnelStats {
  period: {
    dmsSent: number;
    responses: number;
    conversations: number;
    bookings: number;
    shows: number;
    noShows: number;
    closes: number;
    dealsLost: number;
    cashCollected: number;
    revenue: number;
  };
  rates: {
    responseRate: number;
    convoRate: number;
    bookingRate: number;
    showRate: number;
    closeRate: number;
  };
}

// Organic Content Performance
export interface OrganicContent {
  id: string;
  client_id: string;
  report_date: string;
  source: string;           // Platform: Instagram, YouTube, LinkedIn, etc.
  medium: string | null;    // Placement: Bio, Post, Video, Story, etc.
  content_name: string | null; // Content identifier
  page_views: number;
  applications: number;
  qualified: number;
  bookings: number;
  shows: number;
  closes: number;
  cash_collected: number;
  revenue: number;
  created_at: string;
}

// Aggregated Organic Content (for display)
export interface OrganicContentAggregated {
  source: string;
  medium: string;
  contentName: string;
  pageViews: number;
  applications: number;
  bookings: number;
  shows: number;
  closes: number;
  cashCollected: number;
  conversionRate: number; // View to close %
}

// Organic Funnel Stats
export interface OrganicFunnelStats {
  period: {
    pageViews: number;
    applications: number;
    qualified: number;
    bookings: number;
    shows: number;
    noShows: number;
    closes: number;
    dealsLost: number;
    followUps: number;
    cashCollected: number;
    revenue: number;
  };
  rates: {
    viewToApp: number;
    appToQualified: number;
    qualifiedToBooking: number;
    bookingToShow: number;
    showToClose: number;
    overallConversion: number; // View to close
  };
}

// Ad Performance Breakdown
export interface AdPerformance {
  id: string;
  client_id: string;
  report_date: string;
  campaign_name: string;
  adset_name: string | null;
  ad_name: string | null;
  ad_spend: number;
  page_views: number;
  applications: number;
  qualified: number;
  bookings: number;
  shows: number;
  closes: number;
  cash_collected: number;
  revenue: number;
  created_at: string;
}

// Aggregated Ad Performance (for display)
export interface AdPerformanceAggregated {
  source: string;
  adSpend: number;
  pageViews: number;
  applications: number;
  bookings: number;
  shows: number;
  closes: number;
  cashCollected: number;
  roas: number;
  cpa: number;
}

// Scheduled Calls
export interface ScheduledCall {
  id: string;
  client_id: string;
  call_date: string;
  call_time: string;
  lead_name: string;
  lead_email: string | null;
  lead_phone: string | null;
  closer_name: string;
  investment_min: number | null;
  investment_max: number | null;
  investment_notes: string | null;
  confirmed: boolean | null; // null = pending, true = confirmed, false = declined
  status: "scheduled" | "completed" | "no_show" | "rescheduled" | "cancelled";
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  yesterday: {
    dms: number;
    convos: number;
    booked: number;
    shows: number;
    deals: number;
    cash: number;
  };
  weekly: {
    booked: number;
    deals: number;
  };
  period: {
    dials: number;
    outboundDMs: number;
    conversations: number;
    callsBooked: number;
    shows: number;
    dealsClosed: number;
    cash: number;
    revenue: number;
  };
  rates: {
    leadToConvo: number;
    convoToBooked: number;
    showRate: number;
    closeRate: number;
  };
  funnel: {
    messages: number;
    convos: number;
    booked: number;
    closed: number;
  };
}
