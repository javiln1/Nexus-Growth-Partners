"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import type { AdPerformance, AdPerformanceAggregated } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { BENCHMARKS } from "@/lib/benchmarks";

type ViewLevel = "campaign" | "adset" | "ad";
type SortKey = "source" | "adSpend" | "applications" | "closes" | "cashCollected" | "roas" | "cpa";
type SortDir = "asc" | "desc";

interface AdPerformanceProps {
  data: AdPerformance[];
}

function aggregateData(
  data: AdPerformance[],
  level: ViewLevel
): AdPerformanceAggregated[] {
  const grouped = new Map<string, AdPerformanceAggregated>();

  data.forEach((row) => {
    let key: string;
    if (level === "campaign") {
      key = row.campaign_name;
    } else if (level === "adset") {
      key = `${row.campaign_name} / ${row.adset_name || "—"}`;
    } else {
      key = `${row.campaign_name} / ${row.adset_name || "—"} / ${row.ad_name || "—"}`;
    }

    const existing = grouped.get(key);
    if (existing) {
      existing.adSpend += row.ad_spend;
      existing.pageViews += row.page_views;
      existing.applications += row.applications;
      existing.bookings += row.bookings;
      existing.shows += row.shows;
      existing.closes += row.closes;
      existing.cashCollected += row.cash_collected;
    } else {
      grouped.set(key, {
        source: key,
        adSpend: row.ad_spend,
        pageViews: row.page_views,
        applications: row.applications,
        bookings: row.bookings,
        shows: row.shows,
        closes: row.closes,
        cashCollected: row.cash_collected,
        roas: 0,
        cpa: 0,
      });
    }
  });

  // Calculate ROAS and CPA
  const result = Array.from(grouped.values()).map((item) => ({
    ...item,
    roas: item.adSpend > 0 ? item.cashCollected / item.adSpend : 0,
    cpa: item.closes > 0 ? item.adSpend / item.closes : 0,
  }));

  return result;
}

function getStatusColor(roas: number): string {
  if (roas >= BENCHMARKS.roas) return "bg-green-500";
  if (roas >= 1) return "bg-white/50";
  return "bg-red-500";
}

function getStatusText(roas: number): string {
  if (roas >= BENCHMARKS.roas) return "Profitable";
  if (roas >= 1) return "Break-even";
  return "Unprofitable";
}

export function AdPerformanceSection({ data }: AdPerformanceProps) {
  const [viewLevel, setViewLevel] = useState<ViewLevel>("campaign");
  const [sortKey, setSortKey] = useState<SortKey>("cashCollected");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isExpanded, setIsExpanded] = useState(true);

  const aggregated = useMemo(
    () => aggregateData(data, viewLevel),
    [data, viewLevel]
  );

  const sorted = useMemo(() => {
    return [...aggregated].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [aggregated, sortKey, sortDir]);

  const maxCash = Math.max(...sorted.map((r) => r.cashCollected), 1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">
          Ad Performance
        </h2>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </div>

      {isExpanded && (
        <div className="bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
          {/* Header with view toggle */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex gap-2">
              {(["campaign", "adset", "ad"] as ViewLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setViewLevel(level)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    viewLevel === level
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  {level === "campaign"
                    ? "Campaign"
                    : level === "adset"
                    ? "Ad Set"
                    : "Ad"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                ROAS {BENCHMARKS.roas}x+
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/50" />
                1-{BENCHMARKS.roas}x
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {"<1x"}
              </span>
            </div>
          </div>

          {/* Visual bars */}
          <div className="p-4 border-b border-white/10">
            <div className="space-y-3">
              {sorted.slice(0, 5).map((row) => (
                <div key={row.source} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/70 truncate max-w-[200px]">
                        {row.source.split(" / ").pop()}
                      </span>
                      <span className="text-sm text-green-500">
                        {formatCurrency(row.cashCollected)}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500/70 rounded-full transition-all"
                        style={{
                          width: `${(row.cashCollected / maxCash) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <span className="text-xs text-white/40">
                      {row.roas.toFixed(1)}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/10">
                  <th className="p-3 font-medium">
                    <button
                      onClick={() => handleSort("source")}
                      className="flex items-center gap-1 hover:text-white/70"
                    >
                      Source
                      {sortKey === "source" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-medium text-right">
                    <button
                      onClick={() => handleSort("adSpend")}
                      className="flex items-center gap-1 hover:text-white/70 ml-auto"
                    >
                      Spend
                      {sortKey === "adSpend" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-medium text-right">
                    <button
                      onClick={() => handleSort("applications")}
                      className="flex items-center gap-1 hover:text-white/70 ml-auto"
                    >
                      Apps
                      {sortKey === "applications" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-medium text-right">
                    <button
                      onClick={() => handleSort("closes")}
                      className="flex items-center gap-1 hover:text-white/70 ml-auto"
                    >
                      Closed
                      {sortKey === "closes" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-medium text-right">
                    <button
                      onClick={() => handleSort("cashCollected")}
                      className="flex items-center gap-1 hover:text-white/70 ml-auto"
                    >
                      Cash
                      {sortKey === "cashCollected" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-medium text-right">
                    <button
                      onClick={() => handleSort("roas")}
                      className="flex items-center gap-1 hover:text-white/70 ml-auto"
                    >
                      ROAS
                      {sortKey === "roas" && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-medium text-right">
                    <button
                      onClick={() => handleSort("cpa")}
                      className="flex items-center gap-1 hover:text-white/70 ml-auto"
                    >
                      CPA
                      {sortKey === "cpa" && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="p-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr
                    key={row.source}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="p-3">
                      <span className="text-sm text-white/80 truncate block max-w-[250px]">
                        {row.source}
                      </span>
                    </td>
                    <td className="p-3 text-right text-sm text-white/60">
                      {formatCurrency(row.adSpend)}
                    </td>
                    <td className="p-3 text-right text-sm text-white/60">
                      {row.applications}
                    </td>
                    <td className="p-3 text-right text-sm text-white/60">
                      {row.closes}
                    </td>
                    <td className="p-3 text-right text-sm text-green-500 font-medium">
                      {formatCurrency(row.cashCollected)}
                    </td>
                    <td className="p-3 text-right text-sm text-white/80 font-medium">
                      {row.roas.toFixed(1)}x
                    </td>
                    <td className="p-3 text-right text-sm text-white/60">
                      {formatCurrency(row.cpa)}
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mx-auto ${getStatusColor(
                          row.roas
                        )}`}
                        title={getStatusText(row.roas)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
