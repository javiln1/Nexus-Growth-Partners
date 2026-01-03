"use client";

import { useMemo, useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { Trophy, ChevronDown, ChevronUp, ArrowRight, TrendingUp, TrendingDown, Clock, Check, AlertCircle, ClipboardList } from "lucide-react";
import { formatCurrency, calculatePercentChange } from "@/lib/utils";
import { BENCHMARKS, getMetricStatus } from "@/lib/benchmarks";
import { saveUserGoal } from "@/lib/actions/goals";
import { createClient } from "@/lib/supabase/client";
import { OutcomeModal } from "./OutcomeModal";
import type { CloserReport, UserGoal, ScheduledCall } from "@/types/database";

interface CloserPersonalDashboardProps {
  userId: string;
  userName: string;
  closerName: string;
  clientId: string;
  reports: CloserReport[];
  previousReports: CloserReport[];
  rank: number;
  totalClosers: number;
  savedGoal: UserGoal | null;
  todayCalls: ScheduledCall[];
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

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  const change = calculatePercentChange(current, previous);
  const isPositive = change >= 0;

  if (previous === 0 && current === 0) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{change.toFixed(0)}%
    </span>
  );
}

export function CloserPersonalDashboard({
  userId,
  userName,
  closerName,
  clientId,
  reports,
  previousReports,
  rank,
  totalClosers,
  savedGoal,
  todayCalls: initialCalls,
}: CloserPersonalDashboardProps) {
  const [goalAmount, setGoalAmount] = useState(savedGoal?.goal_amount ?? 100000);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [targetAOV, setTargetAOV] = useState(savedGoal?.target_aov ?? 3000);
  const [targetShowRate, setTargetShowRate] = useState(savedGoal?.target_show_rate ?? 65);
  const [targetCloseRate, setTargetCloseRate] = useState(savedGoal?.target_close_rate ?? 30);
  const [isPending, startTransition] = useTransition();

  // Calls Today state
  const [calls, setCalls] = useState<ScheduledCall[]>(initialCalls);
  const [selectedCall, setSelectedCall] = useState<ScheduledCall | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const handleLogOutcome = (call: ScheduledCall) => {
    setSelectedCall(call);
    setShowOutcomeModal(true);
  };

  const handleOutcomeSubmitted = () => {
    setShowOutcomeModal(false);
    setSelectedCall(null);
    // Refresh calls to show updated status
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("scheduled_calls")
      .select("*")
      .eq("closer_name", closerName)
      .eq("call_date", today)
      .order("call_time", { ascending: true })
      .then(({ data }) => {
        if (data) setCalls(data);
      });
  };

  // Auto-save goal when values change (debounced)
  const saveGoal = useCallback(() => {
    startTransition(async () => {
      await saveUserGoal(userId, {
        goalAmount,
        targetAov: targetAOV,
        targetShowRate,
        targetCloseRate,
      });
    });
  }, [userId, goalAmount, targetAOV, targetShowRate, targetCloseRate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveGoal();
    }, 1000);
    return () => clearTimeout(timer);
  }, [goalAmount, targetAOV, targetShowRate, targetCloseRate, saveGoal]);

  // Calculate current period totals
  const stats = useMemo(() => {
    const totals = reports.reduce(
      (acc, r) => ({
        callsOnCalendar: acc.callsOnCalendar + (r.calls_on_calendar || 0),
        shows: acc.shows + (r.shows || 0),
        noShows: acc.noShows + (r.no_shows || 0),
        reschedules: acc.reschedules + (r.reschedules || 0),
        dealsClosed: acc.dealsClosed + (r.deals_closed || 0),
        cashCollected: acc.cashCollected + (r.cash_collected || 0),
        revenue: acc.revenue + (r.revenue_generated || 0),
      }),
      { callsOnCalendar: 0, shows: 0, noShows: 0, reschedules: 0, dealsClosed: 0, cashCollected: 0, revenue: 0 }
    );

    const rates = {
      showRate: totals.callsOnCalendar > 0 ? totals.shows / totals.callsOnCalendar : 0,
      closeRate: totals.shows > 0 ? totals.dealsClosed / totals.shows : 0,
      noShowRate: totals.callsOnCalendar > 0 ? totals.noShows / totals.callsOnCalendar : 0,
      aov: totals.dealsClosed > 0 ? totals.cashCollected / totals.dealsClosed : 0,
    };

    return { totals, rates };
  }, [reports]);

  // Calculate previous period totals
  const prevStats = useMemo(() => {
    const totals = previousReports.reduce(
      (acc, r) => ({
        callsOnCalendar: acc.callsOnCalendar + (r.calls_on_calendar || 0),
        shows: acc.shows + (r.shows || 0),
        noShows: acc.noShows + (r.no_shows || 0),
        dealsClosed: acc.dealsClosed + (r.deals_closed || 0),
        cashCollected: acc.cashCollected + (r.cash_collected || 0),
      }),
      { callsOnCalendar: 0, shows: 0, noShows: 0, dealsClosed: 0, cashCollected: 0 }
    );
    return totals;
  }, [previousReports]);

  const progressPercent = goalAmount > 0 ? Math.min((stats.totals.cashCollected / goalAmount) * 100, 100) : 0;
  const remaining = Math.max(goalAmount - stats.totals.cashCollected, 0);

  // Goal calculator
  const goalCalc = useMemo(() => {
    const closeRate = targetCloseRate / 100;
    const showRate = targetShowRate / 100;

    const dealsNeeded = Math.ceil(remaining / targetAOV);
    const showsNeeded = Math.ceil(dealsNeeded / closeRate);
    const bookingsNeeded = Math.ceil(showsNeeded / showRate);

    return { dealsNeeded, showsNeeded, bookingsNeeded };
  }, [remaining, targetAOV, targetShowRate, targetCloseRate]);

  // Rate status helper
  const getRateColor = (rate: number, benchmark: number) => {
    const status = getMetricStatus(rate, benchmark);
    return status === "green" ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-medium text-white/90">{closerName}</h1>
            {rank > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Trophy className="w-3.5 h-3.5 text-green-500" />
                <span className="text-sm text-white/40">
                  #{rank} of {totalClosers}
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-white/30 uppercase tracking-wider">Last 30 Days</span>
            {isPending && <span className="block text-xs text-green-400/50 mt-0.5">Saving...</span>}
          </div>
        </div>

        {/* HERO: Progress Ring + Cash */}
        <div className="flex flex-col items-center mb-8">
          {/* Large Progress Ring */}
          <div className="relative w-56 h-56 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/[0.06]" />
              <circle
                cx="50" cy="50" r="44" fill="none" stroke="url(#closerHeroGradient)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(progressPercent / 100) * 276.46} 276.46`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="closerHeroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-green-400 tabular-nums">
                {formatCurrency(stats.totals.cashCollected)}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-white/40">of {formatCurrency(goalAmount)}</span>
                <ChangeIndicator current={stats.totals.cashCollected} previous={prevStats.cashCollected} />
              </div>
              <span className="text-xs text-white/25 mt-0.5">
                {remaining > 0 ? `${formatCurrency(remaining)} to go` : "Goal reached!"}
              </span>
            </div>
          </div>

          {/* Goal Presets */}
          <div className="flex items-center gap-2 mb-6">
            {[50000, 100000, 150000, 200000].map((preset) => (
              <button
                key={preset}
                onClick={() => setGoalAmount(preset)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  goalAmount === preset
                    ? "bg-green-500 text-black"
                    : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
                }`}
              >
                {formatCurrency(preset)}
              </button>
            ))}
          </div>

          {/* Primary Action */}
          <Link
            href="/dashboard/submit-eod"
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors text-base"
          >
            Submit EOD Report
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Funnel Flow with Period Comparison */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-1">
            {/* Calls on Calendar */}
            <div className="bg-white/[0.03] rounded-l-lg p-4 relative">
              <div className="text-center">
                <p className="text-2xl font-semibold tabular-nums">{stats.totals.callsOnCalendar}</p>
                <p className="text-xs text-white/40 mt-1">Booked</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className={`text-xs font-medium ${getRateColor(stats.rates.showRate, BENCHMARKS.showRate)}`}>
                    {(stats.rates.showRate * 100).toFixed(0)}%
                  </span>
                  <ChangeIndicator current={stats.totals.callsOnCalendar} previous={prevStats.callsOnCalendar} />
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10">
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </div>
            </div>

            {/* Shows */}
            <div className="bg-white/[0.03] p-4 relative">
              <div className="text-center">
                <p className="text-2xl font-semibold tabular-nums">{stats.totals.shows}</p>
                <p className="text-xs text-white/40 mt-1">Shows</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className={`text-xs font-medium ${getRateColor(stats.rates.closeRate, BENCHMARKS.closeRate)}`}>
                    {(stats.rates.closeRate * 100).toFixed(0)}%
                  </span>
                  <ChangeIndicator current={stats.totals.shows} previous={prevStats.shows} />
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10">
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </div>
            </div>

            {/* Deals Closed */}
            <div className="bg-green-500/10 border border-green-500/20 p-4 relative">
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-400 tabular-nums">{stats.totals.dealsClosed}</p>
                <p className="text-xs text-green-400/60 mt-1">Closed</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="text-xs text-green-400/50 font-medium">{formatCurrency(stats.rates.aov)}</span>
                  <ChangeIndicator current={stats.totals.dealsClosed} previous={prevStats.dealsClosed} />
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10">
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </div>
            </div>

            {/* No Shows */}
            <div className="bg-white/[0.03] rounded-r-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-red-400/80 tabular-nums">{stats.totals.noShows}</p>
                <p className="text-xs text-white/40 mt-1">No Shows</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="text-xs text-red-400/50 font-medium">{(stats.rates.noShowRate * 100).toFixed(0)}%</span>
                  <ChangeIndicator current={stats.totals.noShows} previous={prevStats.noShows} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What You Need (Remaining) */}
        {remaining > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5 mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-4">To hit your goal</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-semibold tabular-nums">{goalCalc.bookingsNeeded}</p>
                <p className="text-xs text-white/30">Bookings</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">{goalCalc.showsNeeded}</p>
                <p className="text-xs text-white/30">Shows</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-green-400 tabular-nums">{goalCalc.dealsNeeded}</p>
                <p className="text-xs text-green-400/50">Closes</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Goal Settings */}
        <div className="border border-white/[0.06] rounded-lg overflow-hidden">
          <button
            onClick={() => setShowGoalSettings(!showGoalSettings)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-xs text-white/40 uppercase tracking-wider">Adjust Assumptions</span>
            {showGoalSettings ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>

          {showGoalSettings && (
            <div className="px-4 pb-4 border-t border-white/[0.06]">
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">AOV</label>
                  <div className="flex items-center bg-white/[0.04] rounded px-2 py-1.5">
                    <span className="text-white/30 text-sm">$</span>
                    <input
                      type="number"
                      value={targetAOV}
                      onChange={(e) => setTargetAOV(Number(e.target.value) || 1500)}
                      className="bg-transparent w-full text-sm font-medium focus:outline-none ml-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Show %</label>
                  <div className="flex items-center bg-white/[0.04] rounded px-2 py-1.5">
                    <input
                      type="number"
                      value={targetShowRate}
                      onChange={(e) => setTargetShowRate(Math.min(100, Math.max(1, Number(e.target.value) || 65)))}
                      className="bg-transparent w-full text-sm font-medium focus:outline-none"
                    />
                    <span className="text-white/30 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Close %</label>
                  <div className="flex items-center bg-white/[0.04] rounded px-2 py-1.5">
                    <input
                      type="number"
                      value={targetCloseRate}
                      onChange={(e) => setTargetCloseRate(Math.min(100, Math.max(1, Number(e.target.value) || 30)))}
                      className="bg-transparent w-full text-sm font-medium focus:outline-none"
                    />
                    <span className="text-white/30 text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-16 mt-8">
            <p className="text-white/40 mb-1">No data yet</p>
            <p className="text-white/25 text-sm">Submit your first EOD report to see your stats</p>
          </div>
        )}

        {/* Calls Today Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Today&apos;s Calls</h2>
            <span className="text-xs text-white/40">
              {calls.length} call{calls.length !== 1 ? "s" : ""}
            </span>
          </div>

          {calls.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 text-center">
              <p className="text-white/40 text-sm">No calls scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className={`bg-white/[0.02] border rounded-lg p-4 transition-colors ${
                    call.status === "completed"
                      ? "border-green-500/30 bg-green-500/5"
                      : call.status === "no_show"
                      ? "border-red-400/30 bg-red-400/5"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Confirmation Status */}
                    <div className="flex-shrink-0">
                      {call.confirmed === true ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        </div>
                      ) : call.confirmed === false ? (
                        <div className="w-6 h-6 rounded-full bg-red-400/20 flex items-center justify-center">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-sm">
                        <Clock className="w-3 h-3 text-white/40" />
                        <span className="font-medium">{formatTime(call.call_time)}</span>
                      </div>
                    </div>

                    {/* Lead Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{call.lead_name}</p>
                      <p className="text-xs text-white/40">
                        <span className="text-green-400">{formatInvestment(call.investment_min, call.investment_max)}</span>
                      </p>
                    </div>

                    {/* Status / Log Outcome Button */}
                    <div className="flex-shrink-0">
                      {call.status !== "scheduled" ? (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            call.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : call.status === "no_show"
                              ? "bg-red-400/20 text-red-400"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {call.status === "no_show" ? "No Show" : call.status}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleLogOutcome(call)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-black text-xs font-medium rounded-lg hover:bg-green-400 transition-colors"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Log Outcome
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outcome Modal */}
        {showOutcomeModal && selectedCall && clientId && (
          <OutcomeModal
            call={selectedCall}
            clientId={clientId}
            onClose={() => {
              setShowOutcomeModal(false);
              setSelectedCall(null);
            }}
            onSubmitted={handleOutcomeSubmitted}
          />
        )}
      </main>
    </div>
  );
}
