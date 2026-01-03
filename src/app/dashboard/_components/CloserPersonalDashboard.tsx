"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { Trophy, Target, Phone, DollarSign, FileText, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BENCHMARKS, getMetricStatus } from "@/lib/benchmarks";
import type { CloserReport } from "@/types/database";

interface CloserPersonalDashboardProps {
  userName: string;
  closerName: string;
  reports: CloserReport[];
  rank: number;
  totalClosers: number;
}

function RateBadge({ rate, benchmark }: { rate: number; benchmark: number }) {
  const status = getMetricStatus(rate, benchmark);
  // Simple: green = good, red = bad
  const isGood = status === "green";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isGood ? "bg-green-500/20 text-green-500" : "bg-red-400/20 text-red-400"}`}>
      {(rate * 100).toFixed(1)}%
    </span>
  );
}

export function CloserPersonalDashboard({
  userName,
  closerName,
  reports,
  rank,
  totalClosers,
}: CloserPersonalDashboardProps) {
  const [goalAmount, setGoalAmount] = useState(100000);
  const [targetAOV, setTargetAOV] = useState(3000);
  const [targetShowRate, setTargetShowRate] = useState(65);
  const [targetCloseRate, setTargetCloseRate] = useState(30);

  // Calculate totals
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
      overallCloseRate: totals.callsOnCalendar > 0 ? totals.dealsClosed / totals.callsOnCalendar : 0,
      aov: totals.dealsClosed > 0 ? totals.cashCollected / totals.dealsClosed : 0,
      cashPerBookedCall: totals.callsOnCalendar > 0 ? totals.cashCollected / totals.callsOnCalendar : 0,
    };

    return { totals, rates };
  }, [reports]);

  // Goal calculator - back-calculate what's needed to hit goal using TARGET rates
  const goalCalc = useMemo(() => {
    const aov = targetAOV;
    const closeRate = targetCloseRate / 100;
    const showRate = targetShowRate / 100;

    const dealsNeeded = Math.ceil(goalAmount / aov);
    const showsNeeded = Math.ceil(dealsNeeded / closeRate);
    const bookingsNeeded = Math.ceil(showsNeeded / showRate);

    return {
      aov,
      closeRate,
      showRate,
      dealsNeeded,
      showsNeeded,
      bookingsNeeded,
    };
  }, [goalAmount, targetAOV, targetShowRate, targetCloseRate]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Rank */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Welcome, {closerName}</h1>
              <p className="text-white/50">Your personal performance dashboard</p>
            </div>
          </div>

          {/* Rank Badge & Submit Button */}
          <div className="flex flex-wrap items-center gap-3">
            {rank > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Trophy className="w-5 h-5 text-green-500" />
                <span className="text-green-500 font-medium">
                  #{rank} of {totalClosers} closers
                </span>
                <span className="text-white/40 text-sm">(by cash collected)</span>
              </div>
            )}
            <Link
              href="/dashboard/submit-eod"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Submit EOD Report
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400/70 text-sm mb-1">Cash Collected</p>
            <p className="text-2xl font-semibold text-green-500">{formatCurrency(stats.totals.cashCollected)}</p>
            <p className="text-xs text-green-400/40 mt-1">Last 30 days</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <p className="text-white/50 text-sm mb-1">Deals Closed</p>
            <p className="text-2xl font-semibold">{stats.totals.dealsClosed}</p>
            <p className="text-xs text-white/40 mt-1">Total closes</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <p className="text-white/50 text-sm mb-1">AOV</p>
            <p className="text-2xl font-semibold">{formatCurrency(stats.rates.aov)}</p>
            <p className="text-xs text-white/40 mt-1">Cash per close</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <p className="text-white/50 text-sm mb-1">Revenue Generated</p>
            <p className="text-2xl font-semibold">{formatCurrency(stats.totals.revenue)}</p>
            <p className="text-xs text-white/40 mt-1">Total revenue</p>
          </div>
        </div>

        {/* Call Funnel */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-500" />
            Call Funnel Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <p className="text-white/50 text-sm mb-1">Calls on Calendar</p>
              <p className="text-xl font-semibold">{stats.totals.callsOnCalendar.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">
                → {(stats.rates.showRate * 100).toFixed(1)}% show rate
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <p className="text-white/50 text-sm mb-1">Shows</p>
              <p className="text-xl font-semibold">{stats.totals.shows.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">
                → {(stats.rates.closeRate * 100).toFixed(1)}% close rate
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <p className="text-white/50 text-sm mb-1">No Shows</p>
              <p className="text-xl font-semibold text-red-400">{stats.totals.noShows.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">
                {(stats.rates.noShowRate * 100).toFixed(1)}% no-show rate
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <p className="text-white/50 text-sm mb-1">Deals Closed</p>
              <p className="text-xl font-semibold text-green-500">{stats.totals.dealsClosed}</p>
              <p className="text-xs text-white/40 mt-1">
                {(stats.rates.overallCloseRate * 100).toFixed(1)}% overall
              </p>
            </div>
          </div>
        </div>

        {/* Conversion Rates with Benchmarks */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6 mb-8">
          <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide">Your Conversion Rates</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-white/50 text-sm mb-2">Show Rate</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{(stats.rates.showRate * 100).toFixed(1)}%</span>
                <RateBadge
                  rate={stats.rates.showRate}
                  benchmark={BENCHMARKS.showRate}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Target: {(BENCHMARKS.showRate * 100)}%+</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-2">Close Rate</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{(stats.rates.closeRate * 100).toFixed(1)}%</span>
                <RateBadge
                  rate={stats.rates.closeRate}
                  benchmark={BENCHMARKS.closeRate}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Target: {(BENCHMARKS.closeRate * 100)}%+</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-2">Overall Close %</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{(stats.rates.overallCloseRate * 100).toFixed(1)}%</span>
              </div>
              <p className="text-xs text-white/30 mt-1">Booked → Closed</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-2">Cash / Booked Call</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{formatCurrency(stats.rates.cashPerBookedCall)}</span>
              </div>
              <p className="text-xs text-white/30 mt-1">Efficiency metric</p>
            </div>
          </div>
        </div>

        {/* Goal Calculator */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8">
          {/* Background glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-green-500/5 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Calculator className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Goal Calculator</h3>
            </div>

            {/* Goal Input & Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Goal Setting */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/50 text-sm font-medium mb-2">Cash Goal</label>
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-lg">$</span>
                    <input
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(Number(e.target.value) || 0)}
                      className="bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-2xl font-bold w-full focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[50000, 100000, 150000, 200000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setGoalAmount(preset)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          goalAmount === preset
                            ? 'bg-green-500 text-black shadow-lg shadow-green-500/25'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {formatCurrency(preset)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Rates */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-white/40 text-xs mb-1">AOV</label>
                    <div className="flex items-center">
                      <span className="text-white/30 text-sm mr-1">$</span>
                      <input
                        type="number"
                        value={targetAOV}
                        onChange={(e) => setTargetAOV(Number(e.target.value) || 1500)}
                        className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-sm font-medium w-full focus:border-green-500/50 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/40 text-xs mb-1">Show %</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={targetShowRate}
                        onChange={(e) => setTargetShowRate(Math.min(100, Math.max(1, Number(e.target.value) || 65)))}
                        className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-sm font-medium w-full focus:border-green-500/50 focus:outline-none transition-all"
                      />
                      <span className="text-white/30 text-sm ml-1">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/40 text-xs mb-1">Close %</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={targetCloseRate}
                        onChange={(e) => setTargetCloseRate(Math.min(100, Math.max(1, Number(e.target.value) || 30)))}
                        className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-sm font-medium w-full focus:border-green-500/50 focus:outline-none transition-all"
                      />
                      <span className="text-white/30 text-sm ml-1">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Circle */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40">
                  {/* Background circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#closerProgressGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min((stats.totals.cashCollected / goalAmount) * 264, 264)} 264`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="closerProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#4ade80" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-green-500">
                      {Math.min(Math.round((stats.totals.cashCollected / goalAmount) * 100), 100)}%
                    </span>
                    <span className="text-xs text-white/40">of goal</span>
                  </div>
                </div>
              </div>

              {/* Current vs Goal */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Current</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totals.cashCollected)}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <p className="text-green-400/60 text-xs uppercase tracking-wider mb-1">Goal</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(goalAmount)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-white/70">
                    {formatCurrency(Math.max(goalAmount - stats.totals.cashCollected, 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Funnel */}
            <div className="mb-6">
              <p className="text-white/50 text-sm font-medium mb-4">What You Need to Hit Your Goal</p>

              {/* Progress Bar */}
              <div className="h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((stats.totals.cashCollected / goalAmount) * 100, 100)}%` }}
                />
              </div>

              {/* Funnel Steps */}
              <div className="relative">
                <div className="grid grid-cols-3 gap-2 md:gap-6">
                  {/* Bookings */}
                  <div className="relative group">
                    <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-xl p-4 md:p-6 border border-white/10 hover:border-white/20 transition-all h-full">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-xl">📅</span>
                        </div>
                        <p className="text-3xl md:text-4xl font-bold text-white">{goalCalc.bookingsNeeded}</p>
                        <p className="text-sm text-white/40 mt-2">Bookings Needed</p>
                        <div className="mt-3 px-3 py-1.5 bg-white/5 rounded-lg inline-block">
                          <p className="text-xs text-white/50">{(goalCalc.showRate * 100).toFixed(0)}% show rate</p>
                        </div>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-white/20 text-2xl z-10">→</div>
                  </div>

                  {/* Shows */}
                  <div className="relative group">
                    <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-xl p-4 md:p-6 border border-white/10 hover:border-white/20 transition-all h-full">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-xl">📞</span>
                        </div>
                        <p className="text-3xl md:text-4xl font-bold text-white">{goalCalc.showsNeeded}</p>
                        <p className="text-sm text-white/40 mt-2">Shows Needed</p>
                        <div className="mt-3 px-3 py-1.5 bg-white/5 rounded-lg inline-block">
                          <p className="text-xs text-white/50">{(goalCalc.closeRate * 100).toFixed(0)}% close rate</p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-white/20 text-2xl z-10">→</div>
                  </div>

                  {/* Deals */}
                  <div className="relative group">
                    <div className="bg-gradient-to-b from-green-500/20 to-green-500/10 rounded-xl p-4 md:p-6 border border-green-500/30 h-full">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-xl">💰</span>
                        </div>
                        <p className="text-3xl md:text-4xl font-bold text-green-500">{goalCalc.dealsNeeded}</p>
                        <p className="text-sm text-green-400/60 mt-2">Deals to Close</p>
                        <div className="mt-3 px-3 py-1.5 bg-green-500/10 rounded-lg inline-block">
                          <p className="text-xs text-green-400/70">{formatCurrency(goalCalc.aov)} AOV</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-white/30 text-xs text-center">
              💡 Improve your show rate and close rate to need fewer bookings to hit your goal
            </p>
          </div>
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50 mb-2">No data for the last 30 days</p>
            <p className="text-white/30 text-sm">
              Your metrics will appear here once you submit EOD reports
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
