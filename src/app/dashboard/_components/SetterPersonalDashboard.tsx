"use client";

import { useState, useMemo } from "react";
import { Navbar } from "./Navbar";
import { Trophy, TrendingUp, MessageCircle, Phone, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DM_BENCHMARKS, getDMRateStatus } from "@/lib/benchmarks";
import type { SetterReport } from "@/types/database";

interface SetterPersonalDashboardProps {
  userName: string;
  setterName: string;
  reports: SetterReport[];
  rank: number;
  totalSetters: number;
}

function RateBadge({ rate, good, warning }: { rate: number; good: number; warning: number }) {
  const status = getDMRateStatus(rate, good, warning);
  const colors = {
    green: "bg-green-500/20 text-green-500",
    yellow: "bg-amber-500/20 text-amber-500",
    red: "bg-red-400/20 text-red-400",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {(rate * 100).toFixed(1)}%
    </span>
  );
}

export function SetterPersonalDashboard({
  userName,
  setterName,
  reports,
  rank,
  totalSetters,
}: SetterPersonalDashboardProps) {
  // Calculate totals
  const stats = useMemo(() => {
    const totals = reports.reduce(
      (acc, r) => ({
        dmsSent: acc.dmsSent + (r.outbound_dms_sent || 0),
        responses: acc.responses + (r.outbound_dm_responses || 0),
        conversations: acc.conversations + (r.conversations || 0),
        bookings: acc.bookings + (r.calls_booked_dms || 0),
        inboundDms: acc.inboundDms + (r.inbound_dms || 0),
        cashCollected: acc.cashCollected + (r.cash_collected || 0),
        revenue: acc.revenue + (r.revenue_generated || 0),
        dials: acc.dials + (r.dials || 0),
        callsBookedDials: acc.callsBookedDials + (r.calls_booked_dials || 0),
      }),
      { dmsSent: 0, responses: 0, conversations: 0, bookings: 0, inboundDms: 0, cashCollected: 0, revenue: 0, dials: 0, callsBookedDials: 0 }
    );

    const rates = {
      responseRate: totals.dmsSent > 0 ? totals.responses / totals.dmsSent : 0,
      conversationRate: totals.responses > 0 ? totals.conversations / totals.responses : 0,
      bookingRate: totals.conversations > 0 ? totals.bookings / totals.conversations : 0,
      overallRate: totals.dmsSent > 0 ? totals.bookings / totals.dmsSent : 0,
    };

    return { totals, rates };
  }, [reports]);

  const totalBookings = stats.totals.bookings + stats.totals.callsBookedDials;

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
              <h1 className="text-2xl font-semibold">Welcome, {setterName}</h1>
              <p className="text-white/50">Your personal performance dashboard</p>
            </div>
          </div>

          {/* Rank Badge */}
          {rank > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-amber-500 font-medium">
                #{rank} of {totalSetters} setters
              </span>
              <span className="text-white/40 text-sm">(by cash collected)</span>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400/70 text-sm mb-1">Cash Collected</p>
            <p className="text-2xl font-semibold text-green-500">{formatCurrency(stats.totals.cashCollected)}</p>
            <p className="text-xs text-green-400/40 mt-1">Last 30 days</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <p className="text-white/50 text-sm mb-1">Calls Booked</p>
            <p className="text-2xl font-semibold">{totalBookings}</p>
            <p className="text-xs text-white/40 mt-1">DMs: {stats.totals.bookings} | Dials: {stats.totals.callsBookedDials}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <p className="text-white/50 text-sm mb-1">DMs Sent</p>
            <p className="text-2xl font-semibold">{stats.totals.dmsSent.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-1">Outbound messages</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <p className="text-white/50 text-sm mb-1">Dials Made</p>
            <p className="text-2xl font-semibold">{stats.totals.dials.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-1">Phone calls</p>
          </div>
        </div>

        {/* DM Funnel */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            DM Funnel Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <p className="text-white/50 text-sm mb-1">DMs Sent</p>
              <p className="text-xl font-semibold">{stats.totals.dmsSent.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">
                → {(stats.rates.responseRate * 100).toFixed(1)}% response
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <p className="text-white/50 text-sm mb-1">Responses</p>
              <p className="text-xl font-semibold">{stats.totals.responses.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">
                → {(stats.rates.conversationRate * 100).toFixed(1)}% to convo
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <p className="text-white/50 text-sm mb-1">Conversations</p>
              <p className="text-xl font-semibold">{stats.totals.conversations.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">
                → {(stats.rates.bookingRate * 100).toFixed(1)}% booked
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <p className="text-white/50 text-sm mb-1">Calls Booked</p>
              <p className="text-xl font-semibold text-green-500">{stats.totals.bookings}</p>
              <p className="text-xs text-white/40 mt-1">
                {(stats.rates.overallRate * 100).toFixed(2)}% overall
              </p>
            </div>
          </div>
        </div>

        {/* Conversion Rates with Benchmarks */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6 mb-8">
          <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide">Your Conversion Rates</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-white/50 text-sm mb-2">Response Rate</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{(stats.rates.responseRate * 100).toFixed(1)}%</span>
                <RateBadge
                  rate={stats.rates.responseRate}
                  good={DM_BENCHMARKS.responseRate}
                  warning={DM_BENCHMARKS.responseRateWarning}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Target: {(DM_BENCHMARKS.responseRate * 100)}%+</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-2">Conversation Rate</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{(stats.rates.conversationRate * 100).toFixed(1)}%</span>
                <RateBadge
                  rate={stats.rates.conversationRate}
                  good={DM_BENCHMARKS.conversationRate}
                  warning={DM_BENCHMARKS.conversationRateWarning}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Target: {(DM_BENCHMARKS.conversationRate * 100)}%+</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-2">Booking Rate</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{(stats.rates.bookingRate * 100).toFixed(1)}%</span>
                <RateBadge
                  rate={stats.rates.bookingRate}
                  good={DM_BENCHMARKS.bookingRate}
                  warning={DM_BENCHMARKS.bookingRateWarning}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Target: {(DM_BENCHMARKS.bookingRate * 100)}%+</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-2">Overall Rate</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold">{(stats.rates.overallRate * 100).toFixed(2)}%</span>
                <RateBadge
                  rate={stats.rates.overallRate}
                  good={DM_BENCHMARKS.overallRate}
                  warning={DM_BENCHMARKS.overallRateWarning}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Target: {(DM_BENCHMARKS.overallRate * 100)}%+</p>
            </div>
          </div>
        </div>

        {/* Inbound Activity */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-blue-400/70 text-sm">Inbound DMs Received</p>
              <p className="text-xl font-semibold text-blue-400">{stats.totals.inboundDms.toLocaleString()}</p>
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
