"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { VSLFunnelReport } from "@/types/database";

interface FunnelTrendChartProps {
  reports: VSLFunnelReport[];
  title: string;
  lines: {
    key: keyof VSLFunnelReport;
    label: string;
    color: string;
  }[];
  formatValue?: (value: number) => string;
}

export function FunnelTrendChart({
  reports,
  title,
  lines,
  formatValue = (v) => v.toLocaleString(),
}: FunnelTrendChartProps) {
  // Sort by date ascending for chart
  const sortedData = [...reports]
    .sort(
      (a, b) =>
        new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
    )
    .map((r) => ({
      ...r,
      date: new Date(r.report_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

  if (sortedData.length === 0) return null;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sortedData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.3)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)" }}
              formatter={(value) => formatValue(Number(value) || 0)}
            />
            {lines.map((line) => (
              <Line
                key={String(line.key)}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: line.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {lines.map((line) => (
          <div key={String(line.key)} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: line.color }}
            />
            <span className="text-sm text-white/70">{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
