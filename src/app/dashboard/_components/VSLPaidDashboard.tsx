"use client";

import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { FunnelTrendChart } from "./FunnelTrendChart";
import { AdPerformanceSection } from "./AdPerformance";
import { ArrowLeft, ArrowRight, Lightbulb, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { VSLFunnelReport, VSLFunnelStats, AdPerformance } from "@/types/database";
import { getThirtyDaysAgo, formatCurrency } from "@/lib/utils";
import { BENCHMARKS } from "@/lib/benchmarks";

interface VSLPaidDashboardProps {
  userName: string;
  clientId: string;
  clientName?: string;
  isExecutive?: boolean;
  isDemo?: boolean;
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

// Goal Progress Component
function GoalProgress({
  current,
  goal,
  daysInPeriod,
  daysElapsed,
}: {
  current: number;
  goal: number;
  daysInPeriod: number;
  daysElapsed: number;
}) {
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const daysRemaining = Math.max(daysInPeriod - daysElapsed, 0);
  const dailyNeeded = daysRemaining > 0 ? (goal - current) / daysRemaining : 0;
  const expectedAtThisPoint = (goal / daysInPeriod) * daysElapsed;
  const paceStatus = current >= expectedAtThisPoint ? "ahead" : "behind";
  const paceDiff = expectedAtThisPoint > 0
    ? Math.abs(((current - expectedAtThisPoint) / expectedAtThisPoint) * 100)
    : 0;

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/50">Monthly Goal</span>
        <span className="text-xs text-white/40">
          {daysElapsed} of {daysInPeriod} days
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-2xl font-semibold text-white">
            {formatCurrency(current)}
          </span>
          <span className="text-sm text-white/50">
            / {formatCurrency(goal)}
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progress >= 100 ? "bg-green-500" : "bg-white/70"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pace + Daily Needed */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          {paceStatus === "ahead" ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={paceStatus === "ahead" ? "text-green-500" : "text-red-400"}>
            {paceDiff.toFixed(0)}% {paceStatus}
          </span>
          <span className="text-white/40">of pace</span>
        </div>
        {daysRemaining > 0 && current < goal && (
          <span className="text-white/40">
            Need {formatCurrency(dailyNeeded)}/day
          </span>
        )}
        {current >= goal && (
          <span className="text-green-500">Goal reached!</span>
        )}
      </div>
    </div>
  );
}

// Generate smart insight from data
function generateInsight(
  stats: VSLFunnelStats,
  prevStats: VSLFunnelStats,
  adPerformance: AdPerformance[]
): { type: "positive" | "warning" | "neutral"; message: string } | null {
  // Check for best performing campaign
  if (adPerformance.length > 0) {
    const aggregated = new Map<string, { spend: number; cash: number; roas: number }>();
    adPerformance.forEach((row) => {
      const existing = aggregated.get(row.campaign_name);
      if (existing) {
        existing.spend += row.ad_spend;
        existing.cash += row.cash_collected;
        existing.roas = existing.spend > 0 ? existing.cash / existing.spend : 0;
      } else {
        aggregated.set(row.campaign_name, {
          spend: row.ad_spend,
          cash: row.cash_collected,
          roas: row.ad_spend > 0 ? row.cash_collected / row.ad_spend : 0,
        });
      }
    });

    const campaigns = Array.from(aggregated.entries())
      .filter(([, data]) => data.spend > 500) // Only campaigns with meaningful spend
      .sort((a, b) => b[1].roas - a[1].roas);

    if (campaigns.length > 1) {
      const [bestName, bestData] = campaigns[0];
      const avgRoas = campaigns.reduce((acc, [, d]) => acc + d.roas, 0) / campaigns.length;
      if (bestData.roas > avgRoas * 1.5) {
        return {
          type: "positive",
          message: `"${bestName}" is outperforming with ${bestData.roas.toFixed(1)}x ROAS (avg: ${avgRoas.toFixed(1)}x)`,
        };
      }
    }
  }

  // Check show rate drop
  if (prevStats.rates.bookingToShow > 0 && stats.rates.bookingToShow > 0) {
    const showRateDrop = ((prevStats.rates.bookingToShow - stats.rates.bookingToShow) / prevStats.rates.bookingToShow) * 100;
    if (showRateDrop > 10) {
      return {
        type: "warning",
        message: `Show rate dropped ${showRateDrop.toFixed(0)}% vs last period. Check lead quality or reminder sequence.`,
      };
    }
  }

  // Check close rate improvement
  if (prevStats.rates.showToClose > 0 && stats.rates.showToClose > 0) {
    const closeRateImprove = ((stats.rates.showToClose - prevStats.rates.showToClose) / prevStats.rates.showToClose) * 100;
    if (closeRateImprove > 15) {
      return {
        type: "positive",
        message: `Close rate improved ${closeRateImprove.toFixed(0)}% vs last period. Sales performance is strong.`,
      };
    }
  }

  // Check ROAS health
  if (stats.roas.cashRoas >= BENCHMARKS.roas * 1.2) {
    return {
      type: "positive",
      message: `ROAS at ${stats.roas.cashRoas.toFixed(1)}x is ${((stats.roas.cashRoas / BENCHMARKS.roas - 1) * 100).toFixed(0)}% above break-even.`,
    };
  }

  if (stats.roas.cashRoas < BENCHMARKS.roas * 0.8 && stats.roas.cashRoas > 0) {
    return {
      type: "warning",
      message: `ROAS at ${stats.roas.cashRoas.toFixed(1)}x is below ${BENCHMARKS.roas}x break-even threshold.`,
    };
  }

  return null;
}

export function VSLPaidDashboard({
  userName,
  clientId,
  clientName,
  isExecutive,
  isDemo,
  initialReports,
  initialAdPerformance = [],
}: VSLPaidDashboardProps) {
  const backPath = isDemo ? "/demo" : isExecutive ? `/dashboard/client/${clientId}` : "/dashboard";
  const [reports, setReports] = useState<VSLFunnelReport[]>(initialReports);
  const [prevReports, setPrevReports] = useState<VSLFunnelReport[]>([]);
  const [adPerformance, setAdPerformance] = useState<AdPerformance[]>(initialAdPerformance);
  const [dateFrom, setDateFrom] = useState(getThirtyDaysAgo());
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const stats = calculateStats(reports);
  const prevStats = calculateStats(prevReports);

  // Calculate days for goal tracking
  const fromDate = new Date(dateFrom);
  const toDate = new Date(dateTo);
  const daysInPeriod = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const today = new Date();
  const daysElapsed = Math.min(
    Math.ceil((today.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)),
    daysInPeriod
  );

  // Monthly cash goal (can be made configurable later)
  const monthlyGoal = 100000;

  // Generate insight
  const insight = generateInsight(stats, prevStats, adPerformance);

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
          href={backPath}
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

        {/* Goal Progress + Insight */}
        {reports.length > 0 && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <GoalProgress
              current={stats.period.cashCollected}
              goal={monthlyGoal}
              daysInPeriod={daysInPeriod}
              daysElapsed={daysElapsed}
            />
            {insight && (
              <div
                className={`bg-white/[0.02] border rounded-lg p-5 flex items-start gap-4 ${
                  insight.type === "positive"
                    ? "border-green-500/30"
                    : insight.type === "warning"
                    ? "border-red-400/30"
                    : "border-white/10"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    insight.type === "positive"
                      ? "bg-green-500/10"
                      : insight.type === "warning"
                      ? "bg-red-400/10"
                      : "bg-white/5"
                  }`}
                >
                  <Lightbulb
                    className={`w-5 h-5 ${
                      insight.type === "positive"
                        ? "text-green-500"
                        : insight.type === "warning"
                        ? "text-red-400"
                        : "text-white/50"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                    Insight
                  </p>
                  <p className="text-sm text-white/80">{insight.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

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
