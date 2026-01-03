"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserGoal } from "@/types/database";

export async function getUserGoal(userId: string, goalType: "monthly" | "weekly" | "custom" = "monthly"): Promise<UserGoal | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("goal_type", goalType)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserGoal;
}

export async function saveUserGoal(
  userId: string,
  goalData: {
    goalType?: "monthly" | "weekly" | "custom";
    goalAmount: number;
    targetAov?: number;
    targetShowRate?: number;
    targetCloseRate?: number;
    targetResponseRate?: number;
    targetConvoRate?: number;
    targetBookingRate?: number;
    targetCashPerBooking?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const goalType = goalData.goalType || "monthly";

  const { error } = await supabase
    .from("user_goals")
    .upsert({
      user_id: userId,
      goal_type: goalType,
      goal_amount: goalData.goalAmount,
      target_aov: goalData.targetAov ?? 3000,
      target_show_rate: goalData.targetShowRate ?? 65,
      target_close_rate: goalData.targetCloseRate ?? 30,
      target_response_rate: goalData.targetResponseRate ?? 5,
      target_convo_rate: goalData.targetConvoRate ?? 50,
      target_booking_rate: goalData.targetBookingRate ?? 30,
      target_cash_per_booking: goalData.targetCashPerBooking ?? 585,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,goal_type",
    });

  if (error) {
    console.error("Error saving goal:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/setter");
  revalidatePath("/dashboard/closer-personal");

  return { success: true };
}
