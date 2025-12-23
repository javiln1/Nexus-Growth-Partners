"use client";

import { formatCurrency, formatPercent } from "@/lib/utils";

interface FunnelMetricCardProps {
  label: string;
  value: number;
  isCurrency?: boolean;
  percentChange?: number;
  conversionRate?: number;
  conversionLabel?: string;
  costPer?: number;
  pace30Day?: number;
  highlight?: "gold" | "green";
  subMetrics?: {
    label: string;
    value: string | number;
    change?: number;
  }[];
}

export function FunnelMetricCard({
  label,
  value,
  isCurrency = false,
  percentChange,
  conversionRate,
  conversionLabel,
  costPer,
  pace30Day,
  highlight,
  subMetrics,
}: FunnelMetricCardProps) {
  const borderColor =
    highlight === "gold"
      ? "border-yellow-500/50"
      : highlight === "green"
      ? "border-green-500/50"
      : "border-white/10";

  const formatValue = (val: number, currency: boolean) => {
    if (currency) {
      return formatCurrency(val);
    }
    return val.toLocaleString();
  };

  return (
    <div
      className={`bg-white/[0.03] border ${borderColor} rounded-lg p-4 flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-white/50 uppercase tracking-wide">
          {label}
        </span>
        {conversionRate !== undefined && (
          <div className="text-right">
            <span className="text-xs text-white/40">{conversionLabel || "Conv"}</span>
            <p className="text-sm font-medium text-white/70">
              {formatPercent(conversionRate)}
            </p>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className={`text-2xl font-semibold ${
            highlight === "gold"
              ? "text-yellow-400"
              : highlight === "green"
              ? "text-green-500"
              : "text-white"
          }`}
        >
          {formatValue(value, isCurrency)}
        </span>
        {percentChange !== undefined && (
          <span
            className={`text-xs font-medium ${
              percentChange >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {percentChange >= 0 ? "↑" : "↓"}
            {Math.abs(percentChange).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Sub Metrics Row */}
      {(costPer !== undefined || pace30Day !== undefined || subMetrics) && (
        <div className="flex gap-4 mt-auto pt-3 border-t border-white/5 text-xs">
          {costPer !== undefined && (
            <div>
              <span className="text-white/40">Cost Per</span>
              <p className="text-white/70 font-medium">
                {formatCurrency(costPer)}
              </p>
            </div>
          )}
          {pace30Day !== undefined && (
            <div>
              <span className="text-white/40">30 Day Pace</span>
              <p className="text-white/70 font-medium">
                {isCurrency ? formatCurrency(pace30Day) : pace30Day.toLocaleString()}
              </p>
            </div>
          )}
          {subMetrics?.map((metric, index) => (
            <div key={index}>
              <span className="text-white/40">{metric.label}</span>
              <p className="text-white/70 font-medium">
                {typeof metric.value === "number"
                  ? metric.value.toLocaleString()
                  : metric.value}
                {metric.change !== undefined && (
                  <span
                    className={`ml-1 ${
                      metric.change >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {metric.change >= 0 ? "↑" : "↓"}
                    {Math.abs(metric.change).toFixed(0)}%
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
