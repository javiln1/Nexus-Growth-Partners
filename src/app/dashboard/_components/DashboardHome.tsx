"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, DollarSign, MessageCircle, Phone, Target, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TrackerCard } from "./TrackerCard";
import { Navbar } from "./Navbar";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Period = "today" | "7d" | "30d" | "90d";

interface AggregateStats {
  cashCollected: number;
  revenue: number;
  closes: number;
  aov: number;
}

interface DashboardHomeProps {
  userName: string;
  clientId: string;
  clientName?: string;
  isExecutive?: boolean;
  isDemo?: boolean;
  initialStats?: AggregateStats;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

function getDateFromPeriod(period: Period): string {
  const date = new Date();
  switch (period) {
    case "today":
      return date.toISOString().split("T")[0];
    case "7d":
      date.setDate(date.getDate() - 7);
      return date.toISOString().split("T")[0];
    case "30d":
      date.setDate(date.getDate() - 30);
      return date.toISOString().split("T")[0];
    case "90d":
      date.setDate(date.getDate() - 90);
      return date.toISOString().split("T")[0];
  }
}

function getPeriodLabel(period: Period): string {
  switch (period) {
    case "today":
      return "Today";
    case "7d":
      return "Last 7 Days";
    case "30d":
      return "Last 30 Days";
    case "90d":
      return "Last 90 Days";
  }
}

export function DashboardHome({ userName, clientId, clientName, isExecutive, isDemo, initialStats }: DashboardHomeProps) {
  // Determine base path for links
  const basePath = isDemo ? "/demo" : isExecutive ? `/dashboard/client/${clientId}` : "/dashboard";
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<AggregateStats | undefined>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [todaysCalls, setTodaysCalls] = useState<{ total: number; confirmed: number }>({ total: 0, confirmed: 0 });

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      const supabase = createClient();
      const fromDate = getDateFromPeriod(period);
      const today = new Date().toISOString().split("T")[0];

      // Fetch funnel stats and today's calls in parallel
      const [funnelResult, callsResult] = await Promise.all([
        supabase
          .from("vsl_funnel_reports")
          .select("cash_collected, revenue, closes")
          .eq("client_id", clientId)
          .gte("report_date", fromDate),
        supabase
          .from("scheduled_calls")
          .select("id, confirmed")
          .eq("client_id", clientId)
          .eq("call_date", today),
      ]);

      if (funnelResult.data) {
        const totals = funnelResult.data.reduce(
          (acc, row) => ({
            cashCollected: acc.cashCollected + (row.cash_collected || 0),
            revenue: acc.revenue + (row.revenue || 0),
            closes: acc.closes + (row.closes || 0),
          }),
          { cashCollected: 0, revenue: 0, closes: 0 }
        );

        setStats({
          ...totals,
          aov: totals.closes > 0 ? totals.cashCollected / totals.closes : 0,
        });
      }

      if (callsResult.data) {
        setTodaysCalls({
          total: callsResult.data.length,
          confirmed: callsResult.data.filter((c) => c.confirmed === true).length,
        });
      }

      setIsLoading(false);
    }

    fetchStats();
  }, [clientId, period]);

  const hasData = stats && stats.closes > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {isExecutive && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Clients
            </Link>
          )}
          <h1 className="text-2xl font-semibold mb-2">
            {clientName ? `${clientName} Dashboard` : "Dashboard"}
          </h1>
          <p className="text-white/50">Select a tracker to view detailed metrics</p>
        </div>

        {/* Aggregate Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40 uppercase tracking-wide">
              All Funnels · {getPeriodLabel(period)}
            </p>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    period === opt.value
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/10 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-20 mb-2" />
                  <div className="h-8 bg-white/10 rounded w-28" />
                </div>
              ))}
            </div>
          ) : hasData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Cash Collected</p>
                <p className="text-2xl font-semibold text-green-500">
                  {formatCurrency(stats.cashCollected)}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Revenue</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(stats.revenue)}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Closes</p>
                <p className="text-2xl font-semibold text-white">
                  {stats.closes}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">AOV</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(stats.aov)}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Cash Collected</p>
                <p className="text-2xl font-semibold text-white/30">$0</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Revenue</p>
                <p className="text-2xl font-semibold text-white/30">$0</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">Closes</p>
                <p className="text-2xl font-semibold text-white/30">0</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <p className="text-white/50 text-sm mb-1">AOV</p>
                <p className="text-2xl font-semibold text-white/30">$0</p>
              </div>
            </div>
          )}
        </div>

        {/* Calls Today Quick Stat */}
        <div className="mb-8">
          <a
            href={`${basePath}/calls-today`}
            className="block bg-white/[0.03] border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Calls Today</p>
                  <p className="text-xl font-semibold">
                    {todaysCalls.total} calls
                    {todaysCalls.total > 0 && (
                      <span className="text-sm font-normal text-white/50 ml-2">
                        ({todaysCalls.confirmed} confirmed)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <span className="text-white/30 text-sm">View →</span>
            </div>
          </a>
        </div>

        {/* Active Trackers */}
        <div className="mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-3">Active Trackers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* EOD Tracker */}
          <TrackerCard
            title="EOD Tracker"
            description="Daily setter and closer reports with KPIs"
            href={`${basePath}/eod`}
            icon={<Users className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />

          {/* VSL Funnel - Paid */}
          <TrackerCard
            title="VSL Funnel (Paid)"
            description="Paid traffic funnel with ROAS metrics"
            href={`${basePath}/vsl-paid`}
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />

          {/* VSL Funnel - Organic */}
          <TrackerCard
            title="VSL Funnel (Organic)"
            description="Organic traffic conversions"
            href={`${basePath}/vsl-organic`}
            icon={<TrendingUp className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />

          {/* Calls Today */}
          <TrackerCard
            title="Calls Today"
            description="Daily call schedule with confirmation tracking"
            href={`${basePath}/calls-today`}
            icon={<Phone className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />

          {/* DM Setter Funnel */}
          <TrackerCard
            title="DM Setter Funnel"
            description="DM outreach performance from messages to booked calls"
            href={`${basePath}/dm-setter`}
            icon={<MessageCircle className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />

          {/* Closer Dashboard */}
          <TrackerCard
            title="Closer Dashboard"
            description="Sales performance from booked calls to closed deals"
            href={`${basePath}/closer`}
            icon={<Target className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
