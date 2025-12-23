"use client";

import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { FunnelTrendChart } from "./FunnelTrendChart";
import { AdPerformanceSection } from "./AdPerformance";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { VSLFunnelReport, VSLFunnelStats, AdPerformance } from "@/types/database";
import { getThirtyDaysAgo, formatCurrency } from "@/lib/utils";
import { BENCHMARKS } from "@/lib/benchmarks";

interface VSLPaidDashboardProps {
  userName: string;
  clientId: string;
  initialReports: VSLFunnelReport[];
  initialAdPerformance?: AdPerformance[];
}

function calculateStats(reports: VSLFunnelReport[]): VSLFunnelStats {
  const totals = reports.reduce(
    (acc, r) => ({
      adSpend: acc.adSpend + (r.ad_spend || 0),
      pageViews: acc.pageViews + r.page_views,
      applications: acc.applications + r.applications,
      qualified: acc.qualified + r.qualified,
      bookings: acc.bookings + r.bookings,
      shows: acc.shows + r.shows,
      noShows: acc.noShows + r.no_shows,
      closes: acc.closes + r.closes,
      dealsLost: acc.dealsLost + r.deals_lost,
      followUps: acc.followUps + (r.follow_ups || 0),
      cashCollected: acc.cashCollected + r.cash_collected,
      revenue: acc.revenue + r.revenue,
    }),
    {
      adSpend: 0,
      pageViews: 0,
      applications: 0,
      qualified: 0,
      bookings: 0,
      shows: 0,
      noShows: 0,
      closes: 0,
      dealsLost: 0,
      followUps: 0,
      cashCollected: 0,
      revenue: 0,
    }
  );

  const rates = {
    viewToApp: totals.pageViews > 0 ? (totals.applications / totals.pageViews) * 100 : 0,
    appToQualified: totals.applications > 0 ? (totals.qualified / totals.applications) * 100 : 0,
    qualifiedToBooking: totals.qualified > 0 ? (totals.bookings / totals.qualified) * 100 : 0,
    bookingToShow: totals.bookings > 0 ? (totals.shows / totals.bookings) * 100 : 0,
    showToClose: totals.shows > 0 ? (totals.closes / totals.shows) * 100 : 0,
  };

  const costs = {
    costPerView: totals.pageViews > 0 ? totals.adSpend / totals.pageViews : 0,
    costPerApp: totals.applications > 0 ? totals.adSpend / totals.applications : 0,
    costPerQualified: totals.qualified > 0 ? totals.adSpend / totals.qualified : 0,
    costPerBooking: totals.bookings > 0 ? totals.adSpend / totals.bookings : 0,
    costPerShow: totals.shows > 0 ? totals.adSpend / totals.shows : 0,
    costPerClose: totals.closes > 0 ? totals.adSpend / totals.closes : 0,
  };

  const roas = {
    revenueRoas: totals.adSpend > 0 ? totals.revenue / totals.adSpend : 0,
    cashRoas: totals.adSpend > 0 ? totals.cashCollected / totals.adSpend : 0,
  };

  return { period: totals, rates, costs, roas };
}

// Financial Card Component
function FinancialCard({
  label,
  value,
  subLabel,
  subValue,
  subStatus,
  status,
  change,
  invertChange,
}: {
  label: string;
  value: string;
  subLabel?: string;
  subValue?: string;
  subStatus?: "green" | "red" | "neutral";
  status?: "green" | "red" | "neutral"; // Based on benchmarks
  change?: number | null;
  invertChange?: boolean; // For metrics where lower is better (like CPA)
}) {
  const valueColor =
    status === "green"
      ? "text-green-500"
      : status === "red"
      ? "text-red-400"
      : "text-white";

  const subValueColor =
    subStatus === "green"
      ? "text-green-500"
      : subStatus === "red"
      ? "text-red-400"
      : "text-white/70";

  // For inverted metrics (CPA), decrease is good (green), increase is bad (red)
  const isPositive = invertChange
    ? (change ?? 0) < 0
    : (change ?? 0) >= 0;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5">
      <p className="text-white/50 text-sm mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
        {change !== undefined && change !== null && (
          <span
            className={`text-xs font-medium ${
              isPositive ? "text-green-500" : "text-red-400"
            }`}
          >
            {change >= 0 ? "↑" : "↓"}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
      </div>
      {subLabel && subValue && (
        <p className="text-white/40 text-sm mt-2">
          {subLabel} <span className={subValueColor}>{subValue}</span>
        </p>
      )}
    </div>
  );
}

// Funnel Stage Component
function FunnelStage({
  label,
  value,
  costPer,
  costBenchmark,
  isLast,
  conversionToNext,
  conversionBenchmark,
}: {
  label: string;
  value: number;
  costPer: number;
  costBenchmark?: number;
  isLast?: boolean;
  conversionToNext?: number;
  conversionBenchmark?: number; // Percentage threshold (e.g., 24 for 24%)
}) {
  const isCostHealthy = costBenchmark ? costPer <= costBenchmark : true;
  const isConversionHealthy = conversionBenchmark && conversionToNext
    ? conversionToNext >= conversionBenchmark
    : true;

  return (
    <div className="flex items-center">
      <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 min-w-[140px]">
        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
        <p className="text-white/40 text-sm mt-1">
          Cost{" "}
          <span className={isCostHealthy ? "text-white/60" : "text-red-400"}>
            {formatCurrency(costPer)}
          </span>
        </p>
      </div>
      {!isLast && conversionToNext !== undefined && (
        <div className="flex flex-col items-center mx-3">
          <ArrowRight className="w-5 h-5 text-white/30" />
          <span
            className={`text-xs mt-1 ${
              isConversionHealthy ? "text-white/50" : "text-red-400 font-medium"
            }`}
          >
            {conversionToNext.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Calculate % change between two values
function calcChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function VSLPaidDashboard({
  userName,
  clientId,
  initialReports,
  initialAdPerformance = [],
}: VSLPaidDashboardProps) {
  const [reports, setReports] = useState<VSLFunnelReport[]>(initialReports);
  const [prevReports, setPrevReports] = useState<VSLFunnelReport[]>([]);
  const [adPerformance, setAdPerformance] = useState<AdPerformance[]>(initialAdPerformance);
  const [dateFrom, setDateFrom] = useState(getThirtyDaysAgo());
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const stats = calculateStats(reports);
  const prevStats = calculateStats(prevReports);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      // Calculate previous period dates (same duration, immediately before)
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevTo = new Date(fromDate);
      prevTo.setDate(prevTo.getDate() - 1);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - daysDiff);

      // Fetch funnel reports
      const { data } = await supabase
        .from("vsl_funnel_reports")
        .select("*")
        .eq("client_id", clientId)
        .eq("funnel_type", "paid")
        .gte("report_date", dateFrom)
        .lte("report_date", dateTo)
        .order("report_date", { ascending: false });

      if (data) {
        setReports(data);
      }

      // Fetch previous period funnel reports
      const { data: prevData } = await supabase
        .from("vsl_funnel_reports")
        .select("*")
        .eq("client_id", clientId)
        .eq("funnel_type", "paid")
        .gte("report_date", prevFrom.toISOString().split("T")[0])
        .lte("report_date", prevTo.toISOString().split("T")[0]);

      if (prevData) {
        setPrevReports(prevData);
      }

      // Fetch ad performance
      const { data: adData } = await supabase
        .from("vsl_ad_performance")
        .select("*")
        .eq("client_id", clientId)
        .gte("report_date", dateFrom)
        .lte("report_date", dateTo);

      if (adData) {
        setAdPerformance(adData);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [clientId, dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">VSL Funnel (Paid)</h1>
            <p className="text-white/50">Paid traffic performance and costs</p>
          </div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-white/50">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50 mb-2">No data for selected period</p>
            <p className="text-white/30 text-sm mb-4">
              Data will appear here once VSL funnel reports are added
            </p>
            <button
              onClick={async () => {
                setIsLoading(true);
                await fetch("/api/seed", { method: "POST" });
                window.location.reload();
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-colors"
            >
              Load Sample Data
            </button>
          </div>
        ) : (
          <>
            {/* SECTION 1: Financial Overview */}
            <div className="mb-8">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">
                  Financial Overview
                </h2>
                {prevReports.length > 0 && (
                  <span className="text-xs text-white/30">vs previous period</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinancialCard
                  label="Ad Spend"
                  value={formatCurrency(stats.period.adSpend)}
                  change={calcChange(stats.period.adSpend, prevStats.period.adSpend)}
                />
                <FinancialCard
                  label="Cash Collected"
                  value={formatCurrency(stats.period.cashCollected)}
                  subLabel="ROAS"
                  subValue={`${stats.roas.cashRoas.toFixed(1)}x`}
                  status={stats.roas.cashRoas >= BENCHMARKS.roas ? "green" : "red"}
                  subStatus={stats.roas.cashRoas >= BENCHMARKS.roas ? "green" : "red"}
                  change={calcChange(stats.period.cashCollected, prevStats.period.cashCollected)}
                />
                <FinancialCard
                  label="Revenue"
                  value={formatCurrency(stats.period.revenue)}
                  subLabel="ROAS"
                  subValue={`${stats.roas.revenueRoas.toFixed(1)}x`}
                  status={stats.roas.revenueRoas >= BENCHMARKS.roas ? "green" : "red"}
                  subStatus={stats.roas.revenueRoas >= BENCHMARKS.roas ? "green" : "red"}
                  change={calcChange(stats.period.revenue, prevStats.period.revenue)}
                />
                <FinancialCard
                  label="Cost Per Acquisition"
                  value={formatCurrency(stats.costs.costPerClose)}
                  status={stats.costs.costPerClose <= BENCHMARKS.cpa ? "green" : "red"}
                  change={prevStats.costs.costPerClose > 0 ? calcChange(stats.costs.costPerClose, prevStats.costs.costPerClose) : null}
                  invertChange
                />
              </div>
            </div>

            {/* SECTION 2: Funnel Flow */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
                Funnel Flow
              </h2>
              <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6 overflow-x-auto">
                <div className="flex items-center gap-0 min-w-max">
                  <FunnelStage
                    label="Page Views"
                    value={stats.period.pageViews}
                    costPer={stats.costs.costPerView}
                    conversionToNext={stats.rates.viewToApp}
                  />
                  <FunnelStage
                    label="Applications"
                    value={stats.period.applications}
                    costPer={stats.costs.costPerApp}
                    costBenchmark={BENCHMARKS.costPerApp}
                    conversionToNext={stats.rates.appToQualified}
                  />
                  <FunnelStage
                    label="Qualified"
                    value={stats.period.qualified}
                    costPer={stats.costs.costPerQualified}
                    conversionToNext={stats.rates.qualifiedToBooking}
                  />
                  <FunnelStage
                    label="Booked"
                    value={stats.period.bookings}
                    costPer={stats.costs.costPerBooking}
                    costBenchmark={BENCHMARKS.costPerBooking}
                    conversionToNext={stats.rates.bookingToShow}
                    conversionBenchmark={BENCHMARKS.showRate * 100}
                  />
                  <FunnelStage
                    label="Showed"
                    value={stats.period.shows}
                    costPer={stats.costs.costPerShow}
                    costBenchmark={BENCHMARKS.costPerShow}
                    conversionToNext={stats.rates.showToClose}
                    conversionBenchmark={BENCHMARKS.closeRate * 100}
                  />
                  <FunnelStage
                    label="Closed"
                    value={stats.period.closes}
                    costPer={stats.costs.costPerClose}
                    costBenchmark={BENCHMARKS.cpa}
                    isLast
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Pipeline & Losses */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
                Pipeline & Losses
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                  <p className="text-white/50 text-sm mb-1">Follow-Ups</p>
                  <p className="text-xl font-semibold text-white">{stats.period.followUps}</p>
                  <p className="text-white/40 text-sm mt-1">
                    {stats.period.shows > 0
                      ? `${((stats.period.followUps / stats.period.shows) * 100).toFixed(0)}% of shows`
                      : "—"}
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                  <p className="text-white/50 text-sm mb-1">No-Shows</p>
                  <p className="text-xl font-semibold text-red-400">{stats.period.noShows}</p>
                  <p className="text-white/40 text-sm mt-1">
                    {stats.period.bookings > 0
                      ? `${((stats.period.noShows / stats.period.bookings) * 100).toFixed(0)}% of booked`
                      : "—"}
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                  <p className="text-white/50 text-sm mb-1">Deals Lost</p>
                  <p className="text-xl font-semibold text-red-400">{stats.period.dealsLost}</p>
                  <p className="text-white/40 text-sm mt-1">
                    {stats.period.shows > 0
                      ? `${((stats.period.dealsLost / stats.period.shows) * 100).toFixed(0)}% of shows`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: Ad Performance */}
            <AdPerformanceSection data={adPerformance} />

            {/* SECTION 5: Trend Charts */}
            <div>
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
                Trends
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FunnelTrendChart
                  reports={reports}
                  title="Funnel Performance"
                  lines={[
                    { key: "page_views", label: "Page Views", color: "rgba(255,255,255,0.5)" },
                    { key: "applications", label: "Applications", color: "#ffffff" },
                    { key: "bookings", label: "Bookings", color: "#22c55e" },
                  ]}
                />
                <FunnelTrendChart
                  reports={reports}
                  title="Financial"
                  lines={[
                    { key: "ad_spend", label: "Ad Spend", color: "rgba(255,255,255,0.5)" },
                    { key: "cash_collected", label: "Cash", color: "#22c55e" },
                  ]}
                  formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
