import { formatCurrency } from "@/lib/utils";
import { StatCard } from "./StatCard";
import { GaugeChart } from "./GaugeChart";
import { COLORS } from "@/lib/constants";

interface CloserStats {
  yesterday: {
    calendar: number;
    shows: number;
    noShows: number;
    deals: number;
    cash: number;
    revenue: number;
  };
  weekly: {
    deals: number;
  };
  period: {
    calendar: number;
    shows: number;
    noShows: number;
    reschedules: number;
    deals: number;
    hotProspects: number;
    warmProspects: number;
    cash: number;
    revenue: number;
  };
}

interface CloserDashboardProps {
  stats: CloserStats;
  weeklyTarget: number;
}

export function CloserDashboard({ stats, weeklyTarget }: CloserDashboardProps) {
  // Calculate conversion rates
  const showRate = stats.period.calendar > 0 ? (stats.period.shows / stats.period.calendar) * 100 : 0;
  const closeRate = stats.period.shows > 0 ? (stats.period.deals / stats.period.shows) * 100 : 0;

  return (
    <div className="space-y-6 mt-6">
      {/* Row 1: Yesterday's KPIs + Weekly Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yesterday's KPIs */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Yesterday&apos;s KPIs</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatCard label="Calls Scheduled" value={stats.yesterday.calendar} />
            <StatCard label="Shows" value={stats.yesterday.shows} />
            <StatCard label="No-Shows" value={stats.yesterday.noShows} color="red" />
            <StatCard label="Deals Closed" value={stats.yesterday.deals} color="green" />
            <StatCard label="Cash Collected" value={formatCurrency(stats.yesterday.cash)} color="green" />
            <StatCard label="Revenue" value={formatCurrency(stats.yesterday.revenue)} color="green" />
          </div>
        </div>

        {/* Weekly Target */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Weekly Target</h2>
          <div className="flex justify-center items-center py-4">
            <GaugeChart
              value={stats.weekly.deals}
              target={weeklyTarget}
              color={COLORS.green}
              label="Deals Closed"
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
            <StatCard label="Calls Scheduled" value={stats.period.calendar} />
            <StatCard label="Shows" value={stats.period.shows} />
            <StatCard label="No-Shows" value={stats.period.noShows} color="red" />
            <StatCard label="Reschedules" value={stats.period.reschedules} />
            <StatCard label="Deals Closed" value={stats.period.deals} color="green" />
            <StatCard label="Hot Prospects" value={stats.period.hotProspects} />
            <StatCard label="Warm Prospects" value={stats.period.warmProspects} />
            <StatCard label="Cash Collected" value={formatCurrency(stats.period.cash)} color="green" />
            <StatCard label="Revenue" value={formatCurrency(stats.period.revenue)} color="green" />
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Conversion Rates</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-md p-4 text-center">
              <div className="text-3xl font-semibold text-white">{Math.round(showRate)}%</div>
              <div className="text-xs text-white/40 mt-1">Show Rate</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-md p-4 text-center">
              <div className="text-3xl font-semibold text-green-500">{Math.round(closeRate)}%</div>
              <div className="text-xs text-white/40 mt-1">Close Rate</div>
            </div>
          </div>

          {/* Funnel */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white/50 mb-3">Funnel</h3>
            <div className="h-8 bg-white/10 rounded flex items-center justify-between px-3" style={{ width: "100%" }}>
              <span className="text-xs">Calls Scheduled</span>
              <span className="text-xs font-medium">{stats.period.calendar}</span>
            </div>
            <div className="h-8 bg-white/10 rounded flex items-center justify-between px-3" style={{ width: "70%" }}>
              <span className="text-xs">Shows</span>
              <span className="text-xs font-medium">{stats.period.shows}</span>
            </div>
            <div className="h-8 bg-green-500/20 rounded flex items-center justify-between px-3" style={{ width: "40%" }}>
              <span className="text-xs text-green-400">Deals Closed</span>
              <span className="text-xs font-medium text-green-400">{stats.period.deals}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
