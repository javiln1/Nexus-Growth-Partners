"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SetterFormData {
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
  key_wins: string;
  main_challenges: string;
  improvements: string;
}

export interface CloserFormData {
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
  primary_objections: string;
  call_types: string;
  // Revenue
  deals_closed: number;
  cash_collected: number;
  revenue_generated: number;
  // Qualitative
  key_wins: string;
  main_challenges: string;
  improvements: string;
}

async function sendSlackNotification(data: {
  role: "setter" | "closer";
  memberName: string;
  reportDate: string;
  cashCollected: number;
  keyMetric: { label: string; value: number };
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("Slack webhook URL not configured");
    return;
  }

  const emoji = data.role === "setter" ? ":telephone_receiver:" : ":handshake:";
  const roleLabel = data.role === "setter" ? "Setter" : "Closer";

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${emoji} *EOD Report Submitted*`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${emoji} *${roleLabel} EOD Report*\n*${data.memberName}* submitted their report for *${data.reportDate}*`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Cash Collected:*\n$${data.cashCollected.toLocaleString()}`,
              },
              {
                type: "mrkdwn",
                text: `*${data.keyMetric.label}:*\n${data.keyMetric.value}`,
              },
            ],
          },
        ],
      }),
    });
  } catch (error) {
    console.error("Slack notification failed:", error);
  }
}

export async function submitSetterReport(formData: SetterFormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("setter_reports").insert({
    client_id: formData.client_id,
    team_member_id: formData.team_member_id,
    member_name: formData.member_name,
    report_date: formData.report_date,
    // Activity
    dials: formData.dials,
    leads_texted: formData.leads_texted,
    outbound_dms_sent: formData.outbound_dms_sent,
    pickups: formData.pickups,
    text_responses: formData.text_responses,
    outbound_dm_responses: formData.outbound_dm_responses,
    inbound_dms: formData.inbound_dms,
    conversations: formData.conversations,
    followups_sent: formData.followups_sent,
    // Bookings
    calls_booked_dials: formData.calls_booked_dials,
    calls_booked_dms: formData.calls_booked_dms,
    live_transfers: formData.live_transfers,
    // Recovery
    noshows_reached: formData.noshows_reached,
    noshows_rebooked: formData.noshows_rebooked,
    old_applicants_called: formData.old_applicants_called,
    old_applicants_rebooked: formData.old_applicants_rebooked,
    cancellations_called: formData.cancellations_called,
    cancellations_rebooked: formData.cancellations_rebooked,
    // Revenue
    cash_collected: formData.cash_collected,
    revenue_generated: formData.revenue_generated,
    // Qualitative
    key_wins: formData.key_wins || null,
    main_challenges: formData.main_challenges || null,
    improvements: formData.improvements || null,
  });

  if (error) {
    console.error("Error inserting setter report:", error);
    return { error: error.message };
  }

  // Send Slack notification
  await sendSlackNotification({
    role: "setter",
    memberName: formData.member_name,
    reportDate: formData.report_date,
    cashCollected: formData.cash_collected,
    keyMetric: {
      label: "Calls Booked",
      value: formData.calls_booked_dials + formData.calls_booked_dms,
    },
  });

  revalidatePath("/dashboard/setter");
  revalidatePath("/dashboard/eod");

  return { success: true };
}

export async function submitCloserReport(formData: CloserFormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("closer_reports").insert({
    client_id: formData.client_id,
    team_member_id: formData.team_member_id,
    member_name: formData.member_name,
    report_date: formData.report_date,
    // Call Metrics
    calls_on_calendar: formData.calls_on_calendar,
    shows: formData.shows,
    no_shows: formData.no_shows,
    reschedules: formData.reschedules,
    followups_booked: formData.followups_booked,
    // Pipeline
    deals_dqd: formData.deals_dqd,
    hot_prospects: formData.hot_prospects,
    warm_prospects: formData.warm_prospects,
    // Qualitative Call Data
    primary_objections: formData.primary_objections || null,
    call_types: formData.call_types || null,
    // Revenue
    deals_closed: formData.deals_closed,
    cash_collected: formData.cash_collected,
    revenue_generated: formData.revenue_generated,
    // Qualitative
    key_wins: formData.key_wins || null,
    main_challenges: formData.main_challenges || null,
    improvements: formData.improvements || null,
  });

  if (error) {
    console.error("Error inserting closer report:", error);
    return { error: error.message };
  }

  // Send Slack notification
  await sendSlackNotification({
    role: "closer",
    memberName: formData.member_name,
    reportDate: formData.report_date,
    cashCollected: formData.cash_collected,
    keyMetric: { label: "Deals Closed", value: formData.deals_closed },
  });

  revalidatePath("/dashboard/closer-personal");
  revalidatePath("/dashboard/eod");

  return { success: true };
}
