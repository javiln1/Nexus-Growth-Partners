"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getThirtyDaysAgo, getToday, getYesterday, getWeekStart } from "@/lib/utils";
import { WEEKLY_TARGETS } from "@/lib/constants";
import type { TeamMember, SetterReport, CloserReport } from "@/types/database";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Navbar } from "./Navbar";
import { Filters } from "./Filters";
import { SetterDashboard } from "./SetterDashboard";
import { CloserDashboard } from "./CloserDashboard";
import { SetterTable } from "./SetterTable";
import { CloserTable } from "./CloserTable";

interface DashboardClientProps {
  userEmail: string;
  userName: string;
  clientId: string;
  clientName?: string;
  isExecutive?: boolean;
  isDemo?: boolean;
  teamMembers: TeamMember[];
  initialSetterReports: SetterReport[];
  initialCloserReports: CloserReport[];
}

export function DashboardClient({
  userEmail,
  userName,
  clientId,
  clientName,
  isExecutive,
  isDemo,
  teamMembers,
  initialSetterReports,
  initialCloserReports,
}: DashboardClientProps) {
  const backPath = isDemo ? "/demo" : isExecutive ? `/dashboard/client/${clientId}` : "/dashboard";
  // Active tab: Setters or Closers
  const [activeTab, setActiveTab] = useState<"Setter" | "Closer">("Setter");

  // Filter state (without role, since we use tabs now)
  const [filters, setFilters] = useState({
    dateFrom: getThirtyDaysAgo(),
    dateTo: getToday(),
    memberId: "",
  });

  // Data state
  const [setterReports, setSetterReports] = useState<SetterReport[]>(initialSetterReports);
  const [closerReports, setCloserReports] = useState<CloserReport[]>(initialCloserReports);
  const [isLoading, setIsLoading] = useState(false);

  // Filter team members by current tab
  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter((m) => m.role === activeTab);
  }, [teamMembers, activeTab]);

  // Fetch data based on filters
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      if (activeTab === "Setter") {
        let query = supabase
          .from("setter_reports")
          .select("*")
          .eq("client_id", clientId)
          .gte("report_date", filters.dateFrom)
          .lte("report_date", filters.dateTo)
          .order("report_date", { ascending: false });

        if (filters.memberId) {
          query = query.eq("member_name", filters.memberId);
        }

        const { data } = await query;
        setSetterReports(data || []);
      } else {
        let query = supabase
          .from("closer_reports")
          .select("*")
          .eq("client_id", clientId)
          .gte("report_date", filters.dateFrom)
          .lte("report_date", filters.dateTo)
          .order("report_date", { ascending: false });

        if (filters.memberId) {
          query = query.eq("member_name", filters.memberId);
        }

        const { data } = await query;
        setCloserReports(data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, filters, activeTab]);

  // Compute setter stats
  const setterStats = useMemo(() => {
    const yesterday = getYesterday();
    const weekStart = getWeekStart();

    const yesterdayData = setterReports.filter((r) => r.report_date === yesterday);
    const weeklyData = setterReports.filter((r) => r.report_date >= weekStart);

    return {
      yesterday: {
        dials: yesterdayData.reduce((sum, r) => sum + (r.dials || 0), 0),
        dms: yesterdayData.reduce((sum, r) => sum + (r.outbound_dms_sent || 0), 0),
        convos: yesterdayData.reduce((sum, r) => sum + (r.conversations || 0), 0),
        booked: yesterdayData.reduce((sum, r) => sum + (r.calls_booked_dials || 0) + (r.calls_booked_dms || 0), 0),
        transfers: yesterdayData.reduce((sum, r) => sum + (r.live_transfers || 0), 0),
        cash: yesterdayData.reduce((sum, r) => sum + (r.cash_collected || 0), 0),
      },
      weekly: {
        booked: weeklyData.reduce((sum, r) => sum + (r.calls_booked_dials || 0) + (r.calls_booked_dms || 0), 0),
      },
      period: {
        dials: setterReports.reduce((sum, r) => sum + (r.dials || 0), 0),
        dms: setterReports.reduce((sum, r) => sum + (r.outbound_dms_sent || 0), 0),
        responses: setterReports.reduce((sum, r) => sum + (r.text_responses || 0) + (r.outbound_dm_responses || 0), 0),
        convos: setterReports.reduce((sum, r) => sum + (r.conversations || 0), 0),
        booked: setterReports.reduce((sum, r) => sum + (r.calls_booked_dials || 0) + (r.calls_booked_dms || 0), 0),
        transfers: setterReports.reduce((sum, r) => sum + (r.live_transfers || 0), 0),
        followups: setterReports.reduce((sum, r) => sum + (r.followups_sent || 0), 0),
        cash: setterReports.reduce((sum, r) => sum + (r.cash_collected || 0), 0),
        revenue: setterReports.reduce((sum, r) => sum + (r.revenue_generated || 0), 0),
      },
    };
  }, [setterReports]);

  // Compute closer stats
  const closerStats = useMemo(() => {
    const yesterday = getYesterday();
    const weekStart = getWeekStart();

    const yesterdayData = closerReports.filter((r) => r.report_date === yesterday);
    const weeklyData = closerReports.filter((r) => r.report_date >= weekStart);

    return {
      yesterday: {
        calendar: yesterdayData.reduce((sum, r) => sum + (r.calls_on_calendar || 0), 0),
        shows: yesterdayData.reduce((sum, r) => sum + (r.shows || 0), 0),
        noShows: yesterdayData.reduce((sum, r) => sum + (r.no_shows || 0), 0),
        deals: yesterdayData.reduce((sum, r) => sum + (r.deals_closed || 0), 0),
        cash: yesterdayData.reduce((sum, r) => sum + (r.cash_collected || 0), 0),
        revenue: yesterdayData.reduce((sum, r) => sum + (r.revenue_generated || 0), 0),
      },
      weekly: {
        deals: weeklyData.reduce((sum, r) => sum + (r.deals_closed || 0), 0),
      },
      period: {
        calendar: closerReports.reduce((sum, r) => sum + (r.calls_on_calendar || 0), 0),
        shows: closerReports.reduce((sum, r) => sum + (r.shows || 0), 0),
        noShows: closerReports.reduce((sum, r) => sum + (r.no_shows || 0), 0),
        reschedules: closerReports.reduce((sum, r) => sum + (r.reschedules || 0), 0),
        deals: closerReports.reduce((sum, r) => sum + (r.deals_closed || 0), 0),
        hotProspects: closerReports.reduce((sum, r) => sum + (r.hot_prospects || 0), 0),
        warmProspects: closerReports.reduce((sum, r) => sum + (r.warm_prospects || 0), 0),
        cash: closerReports.reduce((sum, r) => sum + (r.cash_collected || 0), 0),
        revenue: closerReports.reduce((sum, r) => sum + (r.revenue_generated || 0), 0),
      },
    };
  }, [closerReports]);

  // Handle tab change - reset member filter
  const handleTabChange = (tab: "Setter" | "Closer") => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, memberId: "" }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Link */}
        <Link
          href={backPath}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Role Tabs */}
        <div className="flex mb-6 bg-white/[0.03] rounded-lg p-1 border border-white/10">
          <button
            onClick={() => handleTabChange("Setter")}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-md transition-all ${
              activeTab === "Setter"
                ? "bg-white text-black"
                : "text-white/50 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Setters
          </button>
          <button
            onClick={() => handleTabChange("Closer")}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-md transition-all ${
              activeTab === "Closer"
                ? "bg-white text-black"
                : "text-white/50 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            Closers
          </button>
        </div>

        {/* Filters */}
        <Filters
          filters={filters}
          setFilters={setFilters}
          teamMembers={filteredTeamMembers}
          onApply={fetchData}
          isLoading={isLoading}
        />

        {/* Dashboard Content */}
        {activeTab === "Setter" ? (
          <>
            <SetterDashboard
              stats={setterStats}
              weeklyTarget={WEEKLY_TARGETS.booked}
            />
            <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-medium">Setter Reports ({setterReports.length})</h3>
              </div>
              <div className="p-4">
                <SetterTable reports={setterReports} />
              </div>
            </div>
          </>
        ) : (
          <>
            <CloserDashboard
              stats={closerStats}
              weeklyTarget={WEEKLY_TARGETS.deals}
            />
            <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-medium">Closer Reports ({closerReports.length})</h3>
              </div>
              <div className="p-4">
                <CloserTable reports={closerReports} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
