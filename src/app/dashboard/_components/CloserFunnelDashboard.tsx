"use client";

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "./Navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { CloserReport, TeamMember } from "@/types/database";
import { getThirtyDaysAgo, formatCurrency } from "@/lib/utils";
import { BENCHMARKS, getMetricStatus } from "@/lib/benchmarks";

interface CloserFunnelDashboardProps {
  userName: string;
  clientId: string;
  clientName?: string;
  isExecutive?: boolean;
  isDemo?: boolean;
  teamMembers: TeamMember[];
  initialReports: CloserReport[];
}

interface CloserStats {
  callsOnCalendar: number;
  shows: number;
  noShows: number;
  reschedules: number;
  dealsClosed: number;
  cashCollected: number;
  revenue: number;
}

interface CloserRates {
  showRate: number;
  closeRate: number;
  aov: number;
  cashPerBookedCall: number;
}

function calculateCloserStats(reports: CloserReport[]): { totals: CloserStats; rates: CloserRates } {
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
    aov: totals.dealsClosed > 0 ? totals.cashCollected / totals.dealsClosed : 0,
    cashPerBookedCall: totals.callsOnCalendar > 0 ? totals.cashCollected / totals.callsOnCalendar : 0,
  };

  return { totals, rates };
}

function RateBadge({ rate, benchmark, lowerIsBetter = false }: { rate: number; benchmark: number; lowerIsBetter?: boolean }) {
  const status = getMetricStatus(rate, benchmark, lowerIsBetter);
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

export function CloserFunnelDashboard({
  userName,
  clientId,
  clientName,
  isExecutive,
  isDemo,
  teamMembers,
  initialReports,
}: CloserFunnelDashboardProps) {
  const backPath = isDemo ? "/demo" : isExecutive ? `/dashboard/client/${clientId}` : "/dashboard";
  const [reports, setReports] = useState<CloserReport[]>(initialReports);
  const [dateFrom, setDateFrom] = useState(getThirtyDaysAgo());
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCloser, setSelectedCloser] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Filter closers only
  const closers = teamMembers.filter((m) => m.role === "Closer");

  // Calculate stats from current reports
  const stats = useMemo(() => calculateCloserStats(reports), [reports]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("closer_reports")
        .select("*")
        .eq("client_id", clientId)
        .gte("report_date", dateFrom)
        .lte("report_date", dateTo)
        .order("report_date", { ascending: false });

      if (selectedCloser !== "all") {
        query = query.eq("member_name", selectedCloser);
      }

      const { data } = await query;

      if (data) {
        setReports(data);
      }
      setIsLoading(false);
    }

    fetchData();
  }, [clientId, dateFrom, dateTo, selectedCloser]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={backPath}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Closer Dashboard</h1>
            <p className="text-white/50">
              Sales performance from booked calls to closed deals
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-white/50 mb-2">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-2">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-2">Closer</label>
            <select
              value={selectedCloser}
              onChange={(e) => setSelectedCloser(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
            >
              <option value="all">All Closers</option>
              {closers.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-white/50">Loading...</div>
        ) : (
          <>
            {/* Funnel Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Calls on Calendar</p>
                <p className="text-2xl font-semibold">{stats.totals.callsOnCalendar.toLocaleString()}</p>
                <p className="text-xs text-white/40 mt-1">
                  → {(stats.rates.showRate * 100).toFixed(1)}% show rate
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Shows</p>
                <p className="text-2xl font-semibold">{stats.totals.shows.toLocaleString()}</p>
                <p className="text-xs text-white/40 mt-1">
                  → {(stats.rates.closeRate * 100).toFixed(1)}% close rate
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">No Shows</p>
                <p className="text-2xl font-semibold text-red-400">{stats.totals.noShows.toLocaleString()}</p>
                <p className="text-xs text-white/40 mt-1">
                  {stats.totals.callsOnCalendar > 0
                    ? ((stats.totals.noShows / stats.totals.callsOnCalendar) * 100).toFixed(1)
                    : 0}% no-show rate
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Deals Closed</p>
                <p className="text-2xl font-semibold text-green-500">{stats.totals.dealsClosed.toLocaleString()}</p>
                <p className="text-xs text-white/40 mt-1">
                  {stats.totals.callsOnCalendar > 0
                    ? ((stats.totals.dealsClosed / stats.totals.callsOnCalendar) * 100).toFixed(1)
                    : 0}% overall
                </p>
              </div>
            </div>

            {/* Financial Results */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400/70 text-sm mb-1">Cash Collected</p>
                <p className="text-2xl font-semibold text-green-500">{formatCurrency(stats.totals.cashCollected)}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Revenue</p>
                <p className="text-2xl font-semibold">{formatCurrency(stats.totals.revenue)}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">AOV</p>
                <p className="text-2xl font-semibold">{formatCurrency(stats.rates.aov)}</p>
                <p className="text-xs text-white/40 mt-1">Cash per close</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Cash/Booked Call</p>
                <p className="text-2xl font-semibold">{formatCurrency(stats.rates.cashPerBookedCall)}</p>
                <p className="text-xs text-white/40 mt-1">Efficiency metric</p>
              </div>
            </div>

            {/* Conversion Rates */}
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
              <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide">Conversion Rates</h3>
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
                  <p className="text-white/50 text-sm mb-2">No-Show Rate</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-semibold">
                      {stats.totals.callsOnCalendar > 0
                        ? ((stats.totals.noShows / stats.totals.callsOnCalendar) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">Lower is better</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-2">Overall Close %</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-semibold">
                      {stats.totals.callsOnCalendar > 0
                        ? ((stats.totals.dealsClosed / stats.totals.callsOnCalendar) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">Booked → Closed</p>
                </div>
              </div>
            </div>

            {reports.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50 mb-2">No data for selected period</p>
                <p className="text-white/30 text-sm">
                  Data will appear here once EOD closer reports are submitted
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
