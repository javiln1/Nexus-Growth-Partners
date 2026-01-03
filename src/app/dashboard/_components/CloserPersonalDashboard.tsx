"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { Trophy, Target, Phone, DollarSign, FileText } from "lucide-react";
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
  const colors = {
    green: "bg-green-500/20 text-green-500",
    red: "bg-red-400/20 text-red-400",
    neutral: "bg-white/10 text-white/50",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-amber-500 font-medium">
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

        {/* Financial Summary */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400/70 text-sm">Total Revenue Generated</p>
              <p className="text-xl font-semibold text-green-400">{formatCurrency(stats.totals.revenue)}</p>
            </div>
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
