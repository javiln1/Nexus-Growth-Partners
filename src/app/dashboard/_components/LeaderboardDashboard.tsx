"use client";

import { useState } from "react";
import { Navbar } from "./Navbar";
import { Trophy, TrendingUp, TrendingDown, Crown, Medal } from "lucide-react";
import { formatCurrency, calculatePercentChange } from "@/lib/utils";

interface SetterEntry {
  id: string;
  name: string;
  cash: number;
  bookings: number;
  convos: number;
  prevCash: number;
}

interface CloserEntry {
  id: string;
  name: string;
  cash: number;
  deals: number;
  shows: number;
  prevCash: number;
}

interface LeaderboardDashboardProps {
  userName: string;
  setterLeaderboard: SetterEntry[];
  closerLeaderboard: CloserEntry[];
  currentUserId: string | null;
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Crown className="w-5 h-5 text-yellow-400" />;
  }
  if (rank === 2) {
    return <Medal className="w-5 h-5 text-gray-300" />;
  }
  if (rank === 3) {
    return <Medal className="w-5 h-5 text-amber-600" />;
  }
  return <span className="w-5 text-center text-white/40 font-medium">{rank}</span>;
}

export function LeaderboardDashboard({
  userName,
  setterLeaderboard,
  closerLeaderboard,
  currentUserId,
}: LeaderboardDashboardProps) {
  const [activeTab, setActiveTab] = useState<"setters" | "closers">("closers");

  const totalSetterCash = setterLeaderboard.reduce((sum, s) => sum + s.cash, 0);
  const totalCloserCash = closerLeaderboard.reduce((sum, c) => sum + c.cash, 0);
  const totalBookings = setterLeaderboard.reduce((sum, s) => sum + s.bookings, 0);
  const totalDeals = closerLeaderboard.reduce((sum, c) => sum + c.deals, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-6 h-6 text-green-500" />
          <div>
            <h1 className="text-xl font-medium text-white/90">Team Leaderboard</h1>
            <p className="text-sm text-white/40">Last 30 days performance</p>
          </div>
        </div>

        {/* Team Summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-green-400 tabular-nums">
              {formatCurrency(totalCloserCash)}
            </p>
            <p className="text-xs text-white/40 mt-1">Closer Cash</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums">{totalDeals}</p>
            <p className="text-xs text-white/40 mt-1">Deals Closed</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-green-400 tabular-nums">
              {formatCurrency(totalSetterCash)}
            </p>
            <p className="text-xs text-white/40 mt-1">Setter Cash</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums">{totalBookings}</p>
            <p className="text-xs text-white/40 mt-1">Bookings</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("closers")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "closers"
                ? "bg-green-500 text-black"
                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
            }`}
          >
            Closers ({closerLeaderboard.length})
          </button>
          <button
            onClick={() => setActiveTab("setters")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "setters"
                ? "bg-green-500 text-black"
                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
            }`}
          >
            Setters ({setterLeaderboard.length})
          </button>
        </div>

        {/* Leaderboard Table */}
        {activeTab === "closers" ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/[0.06] text-xs text-white/40 uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-3 text-right">Cash</div>
              <div className="col-span-2 text-right">Deals</div>
              <div className="col-span-2 text-right">Shows</div>
            </div>

            {/* Rows */}
            {closerLeaderboard.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/40">No closer data yet</div>
            ) : (
              closerLeaderboard.map((closer, index) => {
                const rank = index + 1;
                const isCurrentUser = closer.id === currentUserId;
                const closeRate = closer.shows > 0 ? (closer.deals / closer.shows) * 100 : 0;

                return (
                  <div
                    key={closer.id}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-white/[0.03] last:border-0 transition-colors ${
                      isCurrentUser ? "bg-green-500/5 border-l-2 border-l-green-500" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <RankBadge rank={rank} />
                    </div>
                    <div className="col-span-4">
                      <p className={`font-medium ${isCurrentUser ? "text-green-400" : ""}`}>
                        {closer.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-white/30">(You)</span>}
                      </p>
                      <p className="text-xs text-white/30">{closeRate.toFixed(0)}% close rate</p>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className="font-semibold text-green-400 tabular-nums">{formatCurrency(closer.cash)}</p>
                      <ChangeIndicator current={closer.cash} previous={closer.prevCash} />
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="tabular-nums">{closer.deals}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="tabular-nums text-white/60">{closer.shows}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/[0.06] text-xs text-white/40 uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-3 text-right">Cash</div>
              <div className="col-span-2 text-right">Bookings</div>
              <div className="col-span-2 text-right">Convos</div>
            </div>

            {/* Rows */}
            {setterLeaderboard.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/40">No setter data yet</div>
            ) : (
              setterLeaderboard.map((setter, index) => {
                const rank = index + 1;
                const isCurrentUser = setter.id === currentUserId;
                const bookingRate = setter.convos > 0 ? (setter.bookings / setter.convos) * 100 : 0;

                return (
                  <div
                    key={setter.id}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-white/[0.03] last:border-0 transition-colors ${
                      isCurrentUser ? "bg-green-500/5 border-l-2 border-l-green-500" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <RankBadge rank={rank} />
                    </div>
                    <div className="col-span-4">
                      <p className={`font-medium ${isCurrentUser ? "text-green-400" : ""}`}>
                        {setter.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-white/30">(You)</span>}
                      </p>
                      <p className="text-xs text-white/30">{bookingRate.toFixed(0)}% booking rate</p>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className="font-semibold text-green-400 tabular-nums">{formatCurrency(setter.cash)}</p>
                      <ChangeIndicator current={setter.cash} previous={setter.prevCash} />
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="tabular-nums">{setter.bookings}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="tabular-nums text-white/60">{setter.convos}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
