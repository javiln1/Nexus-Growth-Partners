"use client";

import { Users, TrendingUp, DollarSign, MessageCircle } from "lucide-react";
import { TrackerCard } from "./TrackerCard";
import { Navbar } from "./Navbar";

interface DashboardHomeProps {
  userName: string;
}

export function DashboardHome({ userName }: DashboardHomeProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
          <p className="text-white/50">Select a tracker to view detailed metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EOD Tracker */}
          <TrackerCard
            title="EOD Tracker"
            description="Daily setter and closer reports with KPIs and performance metrics"
            href="/dashboard/eod"
            icon={<Users className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />

          {/* VSL Funnel - Paid */}
          <TrackerCard
            title="VSL Funnel (Paid)"
            description="Paid traffic funnel with ad spend, ROAS, and cost per stage metrics"
            href="/dashboard/vsl-paid"
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />

          {/* VSL Funnel - Organic */}
          <TrackerCard
            title="VSL Funnel (Organic)"
            description="Organic traffic funnel tracking conversions without ad spend"
            href="/dashboard/vsl-organic"
            icon={<TrendingUp className="w-6 h-6 text-green-500" />}
            metrics={[
              { label: "Status", value: "Active", color: "green" },
            ]}
          />

          {/* DM Setter Funnel */}
          <TrackerCard
            title="DM Setter Funnel"
            description="DM outreach funnel from messages to closed deals"
            href="/dashboard/dm-setter"
            icon={<MessageCircle className="w-6 h-6 text-white/30" />}
            metrics={[
              { label: "Status", value: "Pending", color: "default" },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
