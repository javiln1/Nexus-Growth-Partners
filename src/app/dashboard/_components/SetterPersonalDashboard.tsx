"use client";

import { useState, useMemo, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { Trophy, ChevronDown, ChevronUp, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, calculatePercentChange } from "@/lib/utils";
import { DM_BENCHMARKS, getDMRateStatus } from "@/lib/benchmarks";
import { saveUserGoal } from "@/lib/actions/goals";
import type { SetterReport, UserGoal } from "@/types/database";

interface BookingOutcome {
  id: string;
  status: string;
  closed: boolean | null;
  cash_amount: number;
  call_date: string;
}

interface SetterPersonalDashboardProps {
  userId: string;
  userName: string;
  setterName: string;
  reports: SetterReport[];
  previousReports: SetterReport[];
  rank: number;
  totalSetters: number;
  savedGoal: UserGoal | null;
  bookingOutcomes: BookingOutcome[];
}

function ChangeIndicator({ current, previous, isCurrency = false }: { current: number; previous: number; isCurrency?: boolean }) {
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

export function SetterPersonalDashboard({
  userId,
  userName,
  setterName,
  reports,
  previousReports,
  rank,
  totalSetters,
  savedGoal,
  bookingOutcomes,
}: SetterPersonalDashboardProps) {
  const [goalAmount, setGoalAmount] = useState(savedGoal?.goal_amount ?? 50000);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [targetCashPerBooking, setTargetCashPerBooking] = useState(savedGoal?.target_cash_per_booking ?? 585);
  const [targetResponseRate, setTargetResponseRate] = useState(savedGoal?.target_response_rate ?? 5);
  const [targetConvoRate, setTargetConvoRate] = useState(savedGoal?.target_convo_rate ?? 50);
  const [targetBookingRate, setTargetBookingRate] = useState(savedGoal?.target_booking_rate ?? 30);
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Auto-save goal when values change (debounced)
  const saveGoal = useCallback(() => {
    startTransition(async () => {
      await saveUserGoal(userId, {
        goalAmount,
        targetCashPerBooking,
        targetResponseRate,
        targetConvoRate,
        targetBookingRate,
      });
      setLastSaved(Date.now());
    });
  }, [userId, goalAmount, targetCashPerBooking, targetResponseRate, targetConvoRate, targetBookingRate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveGoal();
    }, 1000);
    return () => clearTimeout(timer);
  }, [goalAmount, targetCashPerBooking, targetResponseRate, targetConvoRate, targetBookingRate, saveGoal]);

  // Calculate current period totals
  const stats = useMemo(() => {
    const totals = reports.reduce(
      (acc, r) => ({
        dmsSent: acc.dmsSent + (r.outbound_dms_sent || 0),
        responses: acc.responses + (r.outbound_dm_responses || 0),
        conversations: acc.conversations + (r.conversations || 0),
        bookings: acc.bookings + (r.calls_booked_dms || 0),
        cashCollected: acc.cashCollected + (r.cash_collected || 0),
        dials: acc.dials + (r.dials || 0),
        callsBookedDials: acc.callsBookedDials + (r.calls_booked_dials || 0),
      }),
      { dmsSent: 0, responses: 0, conversations: 0, bookings: 0, cashCollected: 0, dials: 0, callsBookedDials: 0 }
    );

    const rates = {
      responseRate: totals.dmsSent > 0 ? totals.responses / totals.dmsSent : 0,
      conversationRate: totals.responses > 0 ? totals.conversations / totals.responses : 0,
      bookingRate: totals.conversations > 0 ? totals.bookings / totals.conversations : 0,
      overallRate: totals.dmsSent > 0 ? totals.bookings / totals.dmsSent : 0,
    };

    return { totals, rates };
  }, [reports]);

  // Calculate previous period totals for comparison
  const prevStats = useMemo(() => {
    const totals = previousReports.reduce(
      (acc, r) => ({
        dmsSent: acc.dmsSent + (r.outbound_dms_sent || 0),
        responses: acc.responses + (r.outbound_dm_responses || 0),
        conversations: acc.conversations + (r.conversations || 0),
        bookings: acc.bookings + (r.calls_booked_dms || 0),
        cashCollected: acc.cashCollected + (r.cash_collected || 0),
        dials: acc.dials + (r.dials || 0),
        callsBookedDials: acc.callsBookedDials + (r.calls_booked_dials || 0),
      }),
      { dmsSent: 0, responses: 0, conversations: 0, bookings: 0, cashCollected: 0, dials: 0, callsBookedDials: 0 }
    );
    return totals;
  }, [previousReports]);

  const totalBookings = stats.totals.bookings + stats.totals.callsBookedDials;
  const prevTotalBookings = prevStats.bookings + prevStats.callsBookedDials;
  const progressPercent = goalAmount > 0 ? Math.min((stats.totals.cashCollected / goalAmount) * 100, 100) : 0;
  const remaining = Math.max(goalAmount - stats.totals.cashCollected, 0);

  // Calculate booking outcomes
  const outcomes = useMemo(() => {
    const total = bookingOutcomes.length;
    const shows = bookingOutcomes.filter(b => b.status === "completed").length;
    const noShows = bookingOutcomes.filter(b => b.status === "no_show").length;
    const closes = bookingOutcomes.filter(b => b.closed === true).length;
    const pending = bookingOutcomes.filter(b => b.status === "scheduled").length;
    const cashFromClosing = bookingOutcomes.reduce((sum, b) => sum + (b.cash_amount || 0), 0);

    const showRate = total > 0 ? (shows / total) * 100 : 0;
    const closeRate = shows > 0 ? (closes / shows) * 100 : 0;

    return { total, shows, noShows, closes, pending, cashFromClosing, showRate, closeRate };
  }, [bookingOutcomes]);

  // Goal calculator
  const goalCalc = useMemo(() => {
    const responseRate = targetResponseRate / 100;
    const conversationRate = targetConvoRate / 100;
    const bookingRate = targetBookingRate / 100;

    const bookingsNeeded = Math.ceil(remaining / targetCashPerBooking);
    const conversationsNeeded = Math.ceil(bookingsNeeded / bookingRate);
    const responsesNeeded = Math.ceil(conversationsNeeded / conversationRate);
    const dmsNeeded = Math.ceil(responsesNeeded / responseRate);

    return { bookingsNeeded, conversationsNeeded, responsesNeeded, dmsNeeded };
  }, [remaining, targetCashPerBooking, targetResponseRate, targetConvoRate, targetBookingRate]);

  // Rate status helper
  const getRateColor = (rate: number, good: number, warning: number) => {
    const status = getDMRateStatus(rate, good, warning);
    return status === "green" ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-medium text-white/90">{setterName}</h1>
            {rank > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Trophy className="w-3.5 h-3.5 text-green-500" />
                <span className="text-sm text-white/40">
                  #{rank} of {totalSetters}
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
                cx="50" cy="50" r="44" fill="none" stroke="url(#heroGradient)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(progressPercent / 100) * 276.46} 276.46`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
                <ChangeIndicator current={stats.totals.cashCollected} previous={prevStats.cashCollected} isCurrency />
              </div>
              <span className="text-xs text-white/25 mt-0.5">
                {remaining > 0 ? `${formatCurrency(remaining)} to go` : "Goal reached!"}
              </span>
            </div>
          </div>

          {/* Goal Presets */}
          <div className="flex items-center gap-2 mb-6">
            {[25000, 50000, 75000, 100000].map((preset) => (
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
            {/* DMs Sent */}
            <div className="bg-white/[0.03] rounded-l-lg p-4 relative">
              <div className="text-center">
                <p className="text-2xl font-semibold tabular-nums">{stats.totals.dmsSent.toLocaleString()}</p>
                <p className="text-xs text-white/40 mt-1">DMs Sent</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className={`text-xs font-medium ${getRateColor(stats.rates.responseRate, DM_BENCHMARKS.responseRate, DM_BENCHMARKS.responseRateWarning)}`}>
                    {(stats.rates.responseRate * 100).toFixed(1)}%
                  </span>
                  <ChangeIndicator current={stats.totals.dmsSent} previous={prevStats.dmsSent} />
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10">
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </div>
            </div>

            {/* Responses */}
            <div className="bg-white/[0.03] p-4 relative">
              <div className="text-center">
                <p className="text-2xl font-semibold tabular-nums">{stats.totals.responses.toLocaleString()}</p>
                <p className="text-xs text-white/40 mt-1">Responses</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className={`text-xs font-medium ${getRateColor(stats.rates.conversationRate, DM_BENCHMARKS.conversationRate, DM_BENCHMARKS.conversationRateWarning)}`}>
                    {(stats.rates.conversationRate * 100).toFixed(0)}%
                  </span>
                  <ChangeIndicator current={stats.totals.responses} previous={prevStats.responses} />
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10">
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </div>
            </div>

            {/* Conversations */}
            <div className="bg-white/[0.03] p-4 relative">
              <div className="text-center">
                <p className="text-2xl font-semibold tabular-nums">{stats.totals.conversations.toLocaleString()}</p>
                <p className="text-xs text-white/40 mt-1">Convos</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className={`text-xs font-medium ${getRateColor(stats.rates.bookingRate, DM_BENCHMARKS.bookingRate, DM_BENCHMARKS.bookingRateWarning)}`}>
                    {(stats.rates.bookingRate * 100).toFixed(0)}%
                  </span>
                  <ChangeIndicator current={stats.totals.conversations} previous={prevStats.conversations} />
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10">
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </div>
            </div>

            {/* Bookings */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-r-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-400 tabular-nums">{totalBookings}</p>
                <p className="text-xs text-green-400/60 mt-1">Booked</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <ChangeIndicator current={totalBookings} previous={prevTotalBookings} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Booking Outcomes */}
        {outcomes.total > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5 mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-4">What happened to your bookings</p>
            <div className="grid grid-cols-5 gap-3 text-center mb-4">
              <div>
                <p className="text-lg font-semibold tabular-nums">{outcomes.total}</p>
                <p className="text-xs text-white/30">Booked</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-green-400 tabular-nums">{outcomes.shows}</p>
                <p className="text-xs text-white/30">Showed</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-red-400 tabular-nums">{outcomes.noShows}</p>
                <p className="text-xs text-white/30">No-Shows</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-green-400 tabular-nums">{outcomes.closes}</p>
                <p className="text-xs text-white/30">Closed</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white/40 tabular-nums">{outcomes.pending}</p>
                <p className="text-xs text-white/30">Pending</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 pt-3 border-t border-white/[0.06]">
              <div className="text-center">
                <span className={`text-sm font-medium ${outcomes.showRate >= 65 ? 'text-green-400' : 'text-red-400'}`}>
                  {outcomes.showRate.toFixed(0)}%
                </span>
                <span className="text-xs text-white/30 ml-1">show rate</span>
              </div>
              <div className="text-center">
                <span className={`text-sm font-medium ${outcomes.closeRate >= 30 ? 'text-green-400' : 'text-red-400'}`}>
                  {outcomes.closeRate.toFixed(0)}%
                </span>
                <span className="text-xs text-white/30 ml-1">close rate</span>
              </div>
              {outcomes.cashFromClosing > 0 && (
                <div className="text-center">
                  <span className="text-sm font-medium text-green-400">
                    {formatCurrency(outcomes.cashFromClosing)}
                  </span>
                  <span className="text-xs text-white/30 ml-1">from closes</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What You Need (Remaining) */}
        {remaining > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5 mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-4">To hit your goal</p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-semibold tabular-nums">{goalCalc.dmsNeeded.toLocaleString()}</p>
                <p className="text-xs text-white/30">DMs</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">{goalCalc.responsesNeeded.toLocaleString()}</p>
                <p className="text-xs text-white/30">Responses</p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">{goalCalc.conversationsNeeded}</p>
                <p className="text-xs text-white/30">Convos</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-green-400 tabular-nums">{goalCalc.bookingsNeeded}</p>
                <p className="text-xs text-green-400/50">Bookings</p>
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
              <div className="grid grid-cols-4 gap-3 pt-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">$/Booking</label>
                  <div className="flex items-center bg-white/[0.04] rounded px-2 py-1.5">
                    <span className="text-white/30 text-sm">$</span>
                    <input
                      type="number"
                      value={targetCashPerBooking}
                      onChange={(e) => setTargetCashPerBooking(Number(e.target.value) || 500)}
                      className="bg-transparent w-full text-sm font-medium focus:outline-none ml-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Response %</label>
                  <div className="flex items-center bg-white/[0.04] rounded px-2 py-1.5">
                    <input
                      type="number"
                      value={targetResponseRate}
                      onChange={(e) => setTargetResponseRate(Math.min(100, Math.max(1, Number(e.target.value) || 5)))}
                      className="bg-transparent w-full text-sm font-medium focus:outline-none"
                    />
                    <span className="text-white/30 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Convo %</label>
                  <div className="flex items-center bg-white/[0.04] rounded px-2 py-1.5">
                    <input
                      type="number"
                      value={targetConvoRate}
                      onChange={(e) => setTargetConvoRate(Math.min(100, Math.max(1, Number(e.target.value) || 50)))}
                      className="bg-transparent w-full text-sm font-medium focus:outline-none"
                    />
                    <span className="text-white/30 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Booking %</label>
                  <div className="flex items-center bg-white/[0.04] rounded px-2 py-1.5">
                    <input
                      type="number"
                      value={targetBookingRate}
                      onChange={(e) => setTargetBookingRate(Math.min(100, Math.max(1, Number(e.target.value) || 30)))}
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
      </main>
    </div>
  );
}
