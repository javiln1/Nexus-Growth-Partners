"use client";

import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { ArrowLeft, ChevronLeft, ChevronRight, Phone, Clock, Check, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ScheduledCall } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface CallsTodayDashboardProps {
  userName: string;
  clientId: string;
  clientName?: string;
  isExecutive?: boolean;
  isDemo?: boolean;
  initialCalls?: ScheduledCall[];
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatInvestment(min: number | null, max: number | null): string {
  if (!min && !max) return "TBD";
  if (min && max) {
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }
  if (min) return `${formatCurrency(min)}+`;
  if (max) return `Up to ${formatCurrency(max)}`;
  return "TBD";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function CallsTodayDashboard({
  userName,
  clientId,
  clientName,
  isExecutive,
  isDemo,
  initialCalls = [],
}: CallsTodayDashboardProps) {
  const backPath = isDemo ? "/demo" : isExecutive ? `/dashboard/client/${clientId}` : "/dashboard";
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calls, setCalls] = useState<ScheduledCall[]>(initialCalls);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total potential
  const totalPotential = calls.reduce((acc, call) => {
    const avg = call.investment_min && call.investment_max
      ? (call.investment_min + call.investment_max) / 2
      : call.investment_min || call.investment_max || 0;
    return acc + avg;
  }, 0);

  // Group by closer
  const closerCounts = calls.reduce((acc, call) => {
    acc[call.closer_name] = (acc[call.closer_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Confirmation stats
  const confirmedCount = calls.filter((c) => c.confirmed === true).length;
  const pendingCount = calls.filter((c) => c.confirmed === null).length;
  const declinedCount = calls.filter((c) => c.confirmed === false).length;

  useEffect(() => {
    async function fetchCalls() {
      setIsLoading(true);
      const supabase = createClient();
      const dateStr = getDateString(selectedDate);

      const { data } = await supabase
        .from("scheduled_calls")
        .select("*")
        .eq("client_id", clientId)
        .eq("call_date", dateStr)
        .order("call_time", { ascending: true });

      if (data) {
        setCalls(data);
      }
      setIsLoading(false);
    }

    fetchCalls();
  }, [clientId, selectedDate]);

  const goToPrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = getDateString(selectedDate) === getDateString(new Date());

  // Toggle confirmation status
  const toggleConfirmed = async (callId: string, currentStatus: boolean | null) => {
    const supabase = createClient();

    // Cycle: null (pending) → true (confirmed) → null (pending)
    // Or: false (declined) → true (confirmed)
    const newStatus = currentStatus === true ? null : true;

    // Optimistic update
    setCalls((prev) =>
      prev.map((c) =>
        c.id === callId ? { ...c, confirmed: newStatus } : c
      )
    );

    // Update database
    const { error } = await supabase
      .from("scheduled_calls")
      .update({ confirmed: newStatus })
      .eq("id", callId);

    if (error) {
      // Revert on error
      setCalls((prev) =>
        prev.map((c) =>
          c.id === callId ? { ...c, confirmed: currentStatus } : c
        )
      );
      console.error("Error updating confirmation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href={backPath}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Calls Today</h1>
            <p className="text-white/50">Daily sales call schedule</p>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevDay}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                isToday
                  ? "bg-white text-black border-white"
                  : "bg-white/5 hover:bg-white/10 border-white/10"
              }`}
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date + Stats Header */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-lg font-medium">{formatDate(selectedDate)}</p>
              <p className="text-white/50 text-sm">
                {calls.length} call{calls.length !== 1 ? "s" : ""} scheduled
                {totalPotential > 0 && (
                  <span className="text-green-500 ml-2">
                    · {formatCurrency(totalPotential)} potential
                  </span>
                )}
              </p>
            </div>

            {/* Confirmation + Closer breakdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Confirmation Stats */}
              {calls.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-xs">
                  <span className="flex items-center gap-1 text-green-500">
                    <Check className="w-3 h-3" />
                    {confirmedCount}
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <AlertCircle className="w-3 h-3" />
                    {pendingCount}
                  </span>
                  {declinedCount > 0 && (
                    <>
                      <span className="text-white/20">|</span>
                      <span className="flex items-center gap-1 text-red-400">
                        <X className="w-3 h-3" />
                        {declinedCount}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Closer breakdown */}
              {Object.entries(closerCounts).map(([closer, count]) => (
                <div
                  key={closer}
                  className="px-3 py-1.5 bg-white/5 rounded-full text-xs"
                >
                  <span className="text-white/70">{closer}</span>
                  <span className="text-white/40 ml-1.5">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calls List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/[0.02] border border-white/10 rounded-lg p-4 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-12 bg-white/10 rounded" />
                  <div className="flex-1">
                    <div className="h-5 bg-white/10 rounded w-32 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Phone className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50 mb-2">No calls scheduled</p>
            <p className="text-white/30 text-sm">
              {isToday
                ? "No calls on the calendar for today"
                : `No calls scheduled for ${formatDate(selectedDate)}`}
            </p>
            <button
              onClick={async () => {
                setIsLoading(true);
                await fetch("/api/seed-calls", { method: "POST" });
                window.location.reload();
              }}
              className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-colors"
            >
              Load Sample Data
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => (
              <div
                key={call.id}
                className={`bg-white/[0.02] border rounded-lg p-4 transition-colors ${
                  call.status === "completed"
                    ? "border-green-500/30 bg-green-500/5"
                    : call.status === "no_show"
                    ? "border-red-400/30 bg-red-400/5"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Confirmation Indicator - Clickable */}
                  <button
                    onClick={() => toggleConfirmed(call.id, call.confirmed)}
                    className="flex-shrink-0 pt-1 group"
                    title={
                      call.confirmed === true
                        ? "Click to unconfirm"
                        : call.confirmed === false
                        ? "Click to confirm"
                        : "Click to confirm"
                    }
                  >
                    {call.confirmed === true ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      </div>
                    ) : call.confirmed === false ? (
                      <div className="w-6 h-6 rounded-full bg-red-400/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                        <X className="w-3.5 h-3.5 text-red-400 group-hover:hidden" />
                        <Check className="w-3.5 h-3.5 text-green-500 hidden group-hover:block" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 group-hover:hidden" />
                        <Check className="w-3.5 h-3.5 text-green-500 hidden group-hover:block" />
                      </div>
                    )}
                  </button>

                  {/* Time */}
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="inline-flex items-center justify-center w-full py-2 px-3 bg-white/5 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-white/40 mr-1.5" />
                      <span className="text-sm font-medium">
                        {formatTime(call.call_time)}
                      </span>
                    </div>
                  </div>

                  {/* Lead Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {call.lead_name}
                    </p>
                    <p className="text-sm text-white/50">
                      Investment:{" "}
                      <span className="text-green-500">
                        {formatInvestment(call.investment_min, call.investment_max)}
                      </span>
                    </p>
                    {call.investment_notes && (
                      <p className="text-xs text-white/40 mt-1 truncate">
                        {call.investment_notes}
                      </p>
                    )}
                  </div>

                  {/* Closer */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-white/70">{call.closer_name}</p>
                    {call.status !== "scheduled" && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          call.status === "completed"
                            ? "bg-green-500/20 text-green-500"
                            : call.status === "no_show"
                            ? "bg-red-400/20 text-red-400"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {call.status === "no_show" ? "No Show" : call.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
