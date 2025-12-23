"use client";

import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { FunnelMetricCard } from "./FunnelMetricCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { DMSetterFunnelReport, TeamMember } from "@/types/database";
import { getThirtyDaysAgo } from "@/lib/utils";

interface DMSetterDashboardProps {
  userName: string;
  clientId: string;
  teamMembers: TeamMember[];
  initialReports: DMSetterFunnelReport[];
}

function calculateStats(reports: DMSetterFunnelReport[]) {
  const totals = reports.reduce(
    (acc, r) => ({
      dmsSent: acc.dmsSent + r.dms_sent,
      responses: acc.responses + r.responses,
      conversations: acc.conversations + r.conversations,
      bookings: acc.bookings + r.bookings,
      shows: acc.shows + r.shows,
      noShows: acc.noShows + r.no_shows,
      closes: acc.closes + r.closes,
      dealsLost: acc.dealsLost + r.deals_lost,
      cashCollected: acc.cashCollected + r.cash_collected,
      revenue: acc.revenue + r.revenue,
    }),
    {
      dmsSent: 0,
      responses: 0,
      conversations: 0,
      bookings: 0,
      shows: 0,
      noShows: 0,
      closes: 0,
      dealsLost: 0,
      cashCollected: 0,
      revenue: 0,
    }
  );

  const rates = {
    responseRate:
      totals.dmsSent > 0 ? (totals.responses / totals.dmsSent) * 100 : 0,
    convoRate:
      totals.responses > 0
        ? (totals.conversations / totals.responses) * 100
        : 0,
    bookingRate:
      totals.conversations > 0
        ? (totals.bookings / totals.conversations) * 100
        : 0,
    showRate:
      totals.bookings > 0 ? (totals.shows / totals.bookings) * 100 : 0,
    closeRate: totals.shows > 0 ? (totals.closes / totals.shows) * 100 : 0,
  };

  return { period: totals, rates };
}

export function DMSetterDashboard({
  userName,
  clientId,
  teamMembers,
  initialReports,
}: DMSetterDashboardProps) {
  const [reports, setReports] = useState<DMSetterFunnelReport[]>(initialReports);
  const [dateFrom, setDateFrom] = useState(getThirtyDaysAgo());
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [memberId, setMemberId] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const stats = calculateStats(reports);

  // Filter setters only
  const setters = teamMembers.filter((m) => m.role === "Setter");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("dm_setter_funnel_reports")
        .select("*")
        .eq("client_id", clientId)
        .gte("report_date", dateFrom)
        .lte("report_date", dateTo)
        .order("report_date", { ascending: false });

      if (memberId !== "all") {
        query = query.eq("team_member_id", memberId);
      }

      const { data } = await query;

      if (data) {
        setReports(data);
      }
      setIsLoading(false);
    }

    fetchData();
  }, [clientId, dateFrom, dateTo, memberId]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">DM Setter Funnel</h1>
            <p className="text-white/50">
              DM outreach funnel from messages to closed deals
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">
                Team Member
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-white/30"
              >
                <option value="all">All Members</option>
                {setters.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-white/50">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50 mb-2">No data for selected period</p>
            <p className="text-white/30 text-sm">
              Data will appear here once DM setter funnel reports are added
            </p>
          </div>
        ) : (
          <>
            {/* Row 1: Funnel Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              <FunnelMetricCard
                label="DMs Sent"
                value={stats.period.dmsSent}
                conversionRate={stats.rates.responseRate}
                conversionLabel="RESP %"
              />
              <FunnelMetricCard
                label="Responses"
                value={stats.period.responses}
                conversionRate={stats.rates.convoRate}
                conversionLabel="CONV %"
              />
              <FunnelMetricCard
                label="Conversations"
                value={stats.period.conversations}
                conversionRate={stats.rates.bookingRate}
                conversionLabel="BOOK %"
              />
              <FunnelMetricCard
                label="Booked"
                value={stats.period.bookings}
                conversionRate={stats.rates.showRate}
                conversionLabel="SHOW %"
              />
              <FunnelMetricCard
                label="Showed"
                value={stats.period.shows}
                conversionRate={stats.rates.closeRate}
                conversionLabel="CLOSE %"
              />
              <FunnelMetricCard
                label="Closed"
                value={stats.period.closes}
              />
            </div>

            {/* Row 2: Financial */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <FunnelMetricCard
                label="Cash Collected"
                value={stats.period.cashCollected}
                isCurrency
                highlight="green"
              />
              <FunnelMetricCard
                label="Revenue"
                value={stats.period.revenue}
                isCurrency
                highlight="gold"
              />
              <FunnelMetricCard
                label="No-Shows"
                value={stats.period.noShows}
              />
              <FunnelMetricCard
                label="Deals Lost"
                value={stats.period.dealsLost}
              />
            </div>

            {/* Conversion Rates */}
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Conversion Rates</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-white/50 text-sm">DM → Response</p>
                  <p className="text-xl font-semibold">
                    {stats.rates.responseRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Response → Convo</p>
                  <p className="text-xl font-semibold">
                    {stats.rates.convoRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Convo → Booked</p>
                  <p className="text-xl font-semibold">
                    {stats.rates.bookingRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Booked → Show</p>
                  <p className="text-xl font-semibold text-green-500">
                    {stats.rates.showRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Show → Close</p>
                  <p className="text-xl font-semibold text-green-500">
                    {stats.rates.closeRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
