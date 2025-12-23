import { formatCurrency, formatDate } from "@/lib/utils";
import type { CloserReport } from "@/types/database";

interface CloserTableProps {
  reports: CloserReport[];
}

export function CloserTable({ reports }: CloserTableProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No closer reports found for the selected period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-2 font-medium text-white/50">Date</th>
            <th className="text-left py-3 px-2 font-medium text-white/50">Name</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Scheduled</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Shows</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">No-Shows</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Rescheduled</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Closed</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Hot</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Warm</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Cash</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 px-2 text-white/60">
                {formatDate(report.report_date)}
              </td>
              <td className="py-3 px-2">{report.member_name}</td>
              <td className="py-3 px-2 text-right">{report.calls_on_calendar}</td>
              <td className="py-3 px-2 text-right">{report.shows}</td>
              <td className="py-3 px-2 text-right text-red-500">{report.no_shows}</td>
              <td className="py-3 px-2 text-right">{report.reschedules}</td>
              <td className="py-3 px-2 text-right text-green-500">{report.deals_closed}</td>
              <td className="py-3 px-2 text-right">{report.hot_prospects}</td>
              <td className="py-3 px-2 text-right">{report.warm_prospects}</td>
              <td className="py-3 px-2 text-right text-green-500">
                {formatCurrency(report.cash_collected)}
              </td>
              <td className="py-3 px-2 text-right text-green-500">
                {formatCurrency(report.revenue_generated)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
