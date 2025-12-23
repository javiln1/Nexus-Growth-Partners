import { formatCurrency } from "@/lib/utils";
import { StatCard } from "./StatCard";

interface YesterdayKPIsProps {
  data: {
    dms: number;
    convos: number;
    booked: number;
    shows: number;
    deals: number;
    cash: number;
  };
}

export function YesterdayKPIs({ data }: YesterdayKPIsProps) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Yesterday&apos;s KPIs</h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <StatCard label="DMs Sent" value={data.dms} />
        <StatCard label="Conversations" value={data.convos} />
        <StatCard label="Calls Booked" value={data.booked} />
        <StatCard label="Shows" value={data.shows} color="green" />
        <StatCard label="Deals Closed" value={data.deals} color="green" />
        <StatCard label="Cash Collected" value={formatCurrency(data.cash)} color="green" />
      </div>
    </div>
  );
}
