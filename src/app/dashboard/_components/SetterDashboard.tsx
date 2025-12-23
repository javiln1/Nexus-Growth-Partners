import { formatCurrency } from "@/lib/utils";
import { StatCard } from "./StatCard";
import { GaugeChart } from "./GaugeChart";
import { COLORS } from "@/lib/constants";

interface SetterStats {
  yesterday: {
    dials: number;
    dms: number;
    convos: number;
    booked: number;
    transfers: number;
    cash: number;
  };
  weekly: {
    booked: number;
  };
  period: {
    dials: number;
    dms: number;
    responses: number;
    convos: number;
    booked: number;
    transfers: number;
    followups: number;
    cash: number;
    revenue: number;
  };
}

interface SetterDashboardProps {
  stats: SetterStats;
  weeklyTarget: number;
}

export function SetterDashboard({ stats, weeklyTarget }: SetterDashboardProps) {
  // Calculate conversion rates
  const responseRate = stats.period.dms > 0 ? (stats.period.responses / stats.period.dms) * 100 : 0;
  const convoRate = stats.period.responses > 0 ? (stats.period.convos / stats.period.responses) * 100 : 0;
  const bookingRate = stats.period.convos > 0 ? (stats.period.booked / stats.period.convos) * 100 : 0;

  return (
    <div className="space-y-6 mt-6">
      {/* Row 1: Yesterday's KPIs + Weekly Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yesterday's KPIs */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Yesterday&apos;s KPIs</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatCard label="Dials" value={stats.yesterday.dials} />
            <StatCard label="DMs Sent" value={stats.yesterday.dms} />
            <StatCard label="Conversations" value={stats.yesterday.convos} />
            <StatCard label="Calls Booked" value={stats.yesterday.booked} />
            <StatCard label="Live Transfers" value={stats.yesterday.transfers} />
            <StatCard label="Cash Collected" value={formatCurrency(stats.yesterday.cash)} color="green" />
          </div>
        </div>

        {/* Weekly Target */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Weekly Target</h2>
          <div className="flex justify-center items-center py-4">
            <GaugeChart
              value={stats.weekly.booked}
              target={weeklyTarget}
              color={COLORS.green}
              label="Calls Booked"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Period Totals + Conversion Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period Totals */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Period Totals</h2>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Dials" value={stats.period.dials} />
            <StatCard label="DMs Sent" value={stats.period.dms} />
            <StatCard label="Responses" value={stats.period.responses} />
            <StatCard label="Conversations" value={stats.period.convos} />
            <StatCard label="Calls Booked" value={stats.period.booked} />
            <StatCard label="Live Transfers" value={stats.period.transfers} />
            <StatCard label="Follow-ups" value={stats.period.followups} />
            <StatCard label="Cash Collected" value={formatCurrency(stats.period.cash)} color="green" />
            <StatCard label="Revenue" value={formatCurrency(stats.period.revenue)} color="green" />
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Conversion Rates</h2>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <StatCard label="Response Rate" value={`${Math.round(responseRate)}%`} />
            <StatCard label="Convo Rate" value={`${Math.round(convoRate)}%`} />
            <StatCard label="Booking Rate" value={`${Math.round(bookingRate)}%`} />
          </div>

          {/* Funnel */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white/50 mb-3">Funnel</h3>
            <div className="h-7 bg-white/10 rounded flex items-center justify-between px-3" style={{ width: "100%" }}>
              <span className="text-xs">DMs Sent</span>
              <span className="text-xs font-medium">{stats.period.dms}</span>
            </div>
            <div className="h-7 bg-white/10 rounded flex items-center justify-between px-3" style={{ width: "80%" }}>
              <span className="text-xs">Responses</span>
              <span className="text-xs font-medium">{stats.period.responses}</span>
            </div>
            <div className="h-7 bg-white/10 rounded flex items-center justify-between px-3" style={{ width: "60%" }}>
              <span className="text-xs">Conversations</span>
              <span className="text-xs font-medium">{stats.period.convos}</span>
            </div>
            <div className="h-7 bg-green-500/20 rounded flex items-center justify-between px-3" style={{ width: "40%" }}>
              <span className="text-xs text-green-400">Calls Booked</span>
              <span className="text-xs font-medium text-green-400">{stats.period.booked}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
