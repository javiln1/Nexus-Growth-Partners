import { formatCurrency } from "@/lib/utils";
import { StatCard } from "./StatCard";

interface PeriodTotalsProps {
  data: {
    dials: number;
    outboundDMs: number;
    conversations: number;
    callsBooked: number;
    shows: number;
    dealsClosed: number;
    cash: number;
    revenue: number;
  };
}

export function PeriodTotals({ data }: PeriodTotalsProps) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Period Totals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Dials" value={data.dials} />
        <StatCard label="Outbound DMs" value={data.outboundDMs} />
        <StatCard label="Conversations" value={data.conversations} />
        <StatCard label="Calls Booked" value={data.callsBooked} />
        <StatCard label="Shows" value={data.shows} color="green" />
        <StatCard label="Deals Closed" value={data.dealsClosed} color="green" />
        <StatCard label="Cash Collected" value={formatCurrency(data.cash)} color="green" />
        <StatCard label="Revenue" value={formatCurrency(data.revenue)} color="green" />
      </div>
    </div>
  );
}
