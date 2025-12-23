import { formatCurrency, formatDate } from "@/lib/utils";
import type { SetterReport } from "@/types/database";

interface SetterTableProps {
  reports: SetterReport[];
}

export function SetterTable({ reports }: SetterTableProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No setter reports found for the selected period.
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
            <th className="text-right py-3 px-2 font-medium text-white/50">Dials</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">DMs Sent</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Responses</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Convos</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Booked</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Transfers</th>
            <th className="text-right py-3 px-2 font-medium text-white/50">Follow-Ups</th>
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
              <td className="py-3 px-2 text-right">{report.dials}</td>
              <td className="py-3 px-2 text-right">{report.outbound_dms_sent}</td>
              <td className="py-3 px-2 text-right">
                {report.text_responses + report.outbound_dm_responses}
              </td>
              <td className="py-3 px-2 text-right">{report.conversations}</td>
              <td className="py-3 px-2 text-right">
                {report.calls_booked_dials + report.calls_booked_dms}
              </td>
              <td className="py-3 px-2 text-right">{report.live_transfers}</td>
              <td className="py-3 px-2 text-right">{report.followups_sent}</td>
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
