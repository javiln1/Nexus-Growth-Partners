"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface SaveOutcomeData {
  clientId: string;
  scheduledCallId: string | null;
  leadName: string;
  leadEmail: string | null;
  leadPhone: string | null;
  outcomeType: "close" | "no_show" | "follow_up" | "deal_lost";
  outcomeDate: string;
  closerName: string | null;
  setterName: string | null;
  // Close fields
  cashCollected: number;
  packageTotal: number;
  paymentType: "pif" | "payment_plan" | null;
  paymentMonths: number | null;
  amountPerPeriod: number | null;
  currentSituation: string | null;
  desiredSituation: string | null;
  obstacles: string | null;
  // No Show / Deal Lost
  reason: string | null;
  // Follow Up
  followUpDate: string | null;
  followUpReason: string | null;
  depositAmount: number;
}

export async function saveOutcome(
  data: SaveOutcomeData
): Promise<{ success: boolean; error?: string; outcomeId?: string }> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // 1. Insert outcome record
    const { data: outcome, error: outcomeError } = await supabase
      .from("outcomes")
      .insert({
        client_id: data.clientId,
        scheduled_call_id: data.scheduledCallId,
        lead_name: data.leadName,
        lead_email: data.leadEmail,
        lead_phone: data.leadPhone,
        outcome_type: data.outcomeType,
        outcome_date: data.outcomeDate,
        closer_name: data.closerName,
        setter_name: data.setterName,
        cash_collected: data.cashCollected,
        package_total: data.packageTotal,
        payment_type: data.paymentType,
        payment_months: data.paymentMonths,
        amount_per_period: data.amountPerPeriod,
        current_situation: data.currentSituation,
        desired_situation: data.desiredSituation,
        obstacles: data.obstacles,
        reason: data.reason,
        follow_up_date: data.followUpDate,
        follow_up_reason: data.followUpReason,
        deposit_amount: data.depositAmount,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (outcomeError) {
      console.error("Error saving outcome:", outcomeError);
      return { success: false, error: outcomeError.message };
    }

    // 2. Update scheduled call status if linked
    if (data.scheduledCallId) {
      const callStatus = data.outcomeType === "close"
        ? "completed"
        : data.outcomeType === "no_show"
        ? "no_show"
        : data.outcomeType === "follow_up"
        ? "rescheduled"
        : "completed"; // deal_lost counts as completed

      const { error: callError } = await supabase
        .from("scheduled_calls")
        .update({
          status: callStatus,
          closed: data.outcomeType === "close",
          cash_amount: data.cashCollected,
          outcome: data.outcomeType === "close"
            ? `Closed - ${data.paymentType === "pif" ? "PIF" : "Payment Plan"} - $${data.cashCollected}`
            : data.outcomeType === "no_show"
            ? `No Show - ${data.reason || "No reason provided"}`
            : data.outcomeType === "follow_up"
            ? `Follow Up - ${data.followUpDate || "TBD"}`
            : `Deal Lost - ${data.reason || "No reason provided"}`,
        })
        .eq("id", data.scheduledCallId);

      if (callError) {
        console.error("Error updating scheduled call:", callError);
        // Don't fail the whole operation, outcome is saved
      }
    }

    // 3. TODO: Push to Close CRM (will be implemented in step 5)
    // 4. TODO: Send Slack/Telegram notification (will be implemented in step 6)

    // Revalidate relevant paths
    revalidatePath("/dashboard/calls-today");
    revalidatePath("/dashboard");

    return { success: true, outcomeId: outcome.id };
  } catch (error) {
    console.error("Unexpected error saving outcome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get outcomes for a client
export async function getOutcomes(
  clientId: string,
  dateFrom?: string,
  dateTo?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from("outcomes")
    .select("*")
    .eq("client_id", clientId)
    .order("outcome_date", { ascending: false });

  if (dateFrom) {
    query = query.gte("outcome_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("outcome_date", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching outcomes:", error);
    return [];
  }

  return data;
}

// Get outcome stats for dashboards
export async function getOutcomeStats(clientId: string, dateFrom: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("outcomes")
    .select("outcome_type, cash_collected, package_total")
    .eq("client_id", clientId)
    .gte("outcome_date", dateFrom);

  if (error) {
    console.error("Error fetching outcome stats:", error);
    return {
      closes: 0,
      noShows: 0,
      followUps: 0,
      dealsLost: 0,
      totalCash: 0,
      totalRevenue: 0,
    };
  }

  return {
    closes: data.filter((o) => o.outcome_type === "close").length,
    noShows: data.filter((o) => o.outcome_type === "no_show").length,
    followUps: data.filter((o) => o.outcome_type === "follow_up").length,
    dealsLost: data.filter((o) => o.outcome_type === "deal_lost").length,
    totalCash: data
      .filter((o) => o.outcome_type === "close")
      .reduce((sum, o) => sum + (o.cash_collected || 0), 0),
    totalRevenue: data
      .filter((o) => o.outcome_type === "close")
      .reduce((sum, o) => sum + (o.package_total || 0), 0),
  };
}
