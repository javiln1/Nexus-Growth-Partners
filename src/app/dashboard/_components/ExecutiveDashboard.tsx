"use client";

import Link from "next/link";
import { Navbar } from "./Navbar";
import { Building2, ArrowRight, DollarSign, TrendingUp, Users, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface AggregateStats {
  cashCollected: number;
  revenue: number;
  closes: number;
  callsToday: number;
}

interface ExecutiveDashboardProps {
  userName: string;
  clients: Client[];
  stats?: AggregateStats;
}

export function ExecutiveDashboard({ userName, clients, stats }: ExecutiveDashboardProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
            <p className="text-white/40 text-sm mt-1">All clients · Last 30 days</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-500 text-xs font-medium">Executive</span>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-white/50 text-xs uppercase tracking-wide">Cash Collected</span>
              </div>
              <p className="text-2xl font-semibold text-green-400 tabular-nums">
                {formatCurrency(stats.cashCollected)}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-white/40" />
                <span className="text-white/50 text-xs uppercase tracking-wide">Revenue</span>
              </div>
              <p className="text-2xl font-semibold text-white tabular-nums">
                {formatCurrency(stats.revenue)}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-white/40" />
                <span className="text-white/50 text-xs uppercase tracking-wide">Closes</span>
              </div>
              <p className="text-2xl font-semibold text-white tabular-nums">
                {stats.closes}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-white/40" />
                <span className="text-white/50 text-xs uppercase tracking-wide">Calls Today</span>
              </div>
              <p className="text-2xl font-semibold text-white tabular-nums">
                {stats.callsToday}
              </p>
            </div>
          </div>
        )}

        {/* Clients Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white/90">Clients</h2>
            <span className="text-xs text-white/30">{clients.length} total</span>
          </div>

          {clients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clients.map((client, index) => (
                <Link
                  key={client.id}
                  href={`/dashboard/client/${client.id}`}
                  className="group relative bg-white/[0.02] border border-white/10 rounded-xl p-5 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/30 font-semibold text-sm">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white/90 group-hover:text-white transition-colors">
                          {client.name}
                        </h3>
                        <p className="text-xs text-white/30">View dashboard</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/[0.02] border border-white/10 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/40 text-sm">No clients yet</p>
              <p className="text-white/20 text-xs mt-1">Clients will appear here once added</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
