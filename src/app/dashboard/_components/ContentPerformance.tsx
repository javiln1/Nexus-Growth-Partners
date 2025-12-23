"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { OrganicContent } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface ContentPerformanceProps {
  data: OrganicContent[];
}

interface AggregatedItem {
  name: string;
  pageViews: number;
  applications: number;
  bookings: number;
  shows: number;
  closes: number;
  cashCollected: number;
  conversionRate: number;
}

function aggregateByField(
  data: OrganicContent[],
  field: "source" | "medium" | "content_name"
): AggregatedItem[] {
  const grouped = new Map<string, AggregatedItem>();

  data.forEach((row) => {
    const key = row[field] || "Unknown";
    const existing = grouped.get(key);

    if (existing) {
      existing.pageViews += row.page_views;
      existing.applications += row.applications;
      existing.bookings += row.bookings;
      existing.shows += row.shows;
      existing.closes += row.closes;
      existing.cashCollected += row.cash_collected;
    } else {
      grouped.set(key, {
        name: key,
        pageViews: row.page_views,
        applications: row.applications,
        bookings: row.bookings,
        shows: row.shows,
        closes: row.closes,
        cashCollected: row.cash_collected,
        conversionRate: 0,
      });
    }
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      conversionRate: item.pageViews > 0 ? (item.closes / item.pageViews) * 100 : 0,
    }))
    .sort((a, b) => b.cashCollected - a.cashCollected);
}

function getTotalStats(data: OrganicContent[]) {
  return data.reduce(
    (acc, row) => ({
      pageViews: acc.pageViews + row.page_views,
      applications: acc.applications + row.applications,
      closes: acc.closes + row.closes,
      cashCollected: acc.cashCollected + row.cash_collected,
    }),
    { pageViews: 0, applications: 0, closes: 0, cashCollected: 0 }
  );
}

export function ContentPerformanceSection({ data }: ContentPerformanceProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [expandedPlacement, setExpandedPlacement] = useState<string | null>(null);

  // Get unique platforms
  const platforms = useMemo(() => {
    const unique = [...new Set(data.map((d) => d.source))];
    return unique.sort();
  }, [data]);

  // Filter data by selected platform
  const filteredData = useMemo(() => {
    if (!selectedPlatform) return data;
    return data.filter((d) => d.source === selectedPlatform);
  }, [data, selectedPlatform]);

  // Get stats for current view
  const totalStats = useMemo(() => getTotalStats(filteredData), [filteredData]);

  // Aggregate data based on view
  const aggregatedItems = useMemo(() => {
    if (!selectedPlatform) {
      // Show platforms
      return aggregateByField(data, "source");
    }
    // Show placements within platform
    return aggregateByField(filteredData, "medium");
  }, [data, filteredData, selectedPlatform]);

  // Get content within a placement (for expansion)
  const getContentForPlacement = (placement: string) => {
    const placementData = filteredData.filter((d) => d.medium === placement);
    return aggregateByField(placementData, "content_name");
  };

  const maxCash = Math.max(...aggregatedItems.map((r) => r.cashCollected), 1);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
        Content Performance
      </h2>

      <div className="bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
        {/* Platform Filter */}
        <div className="p-4 border-b border-white/10">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedPlatform(null);
                setExpandedPlacement(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedPlatform === null
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              All Platforms
            </button>
            {platforms.map((platform) => (
              <button
                key={platform}
                onClick={() => {
                  setSelectedPlatform(platform);
                  setExpandedPlacement(null);
                }}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  selectedPlatform === platform
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-white/50">
              {selectedPlatform || "All Platforms"}
            </span>
            <span className="text-white/40">
              {totalStats.pageViews.toLocaleString()} views
            </span>
            <span className="text-white/40">
              {totalStats.applications} apps
            </span>
            <span className="text-white/40">
              {totalStats.closes} closes
            </span>
            <span className="text-green-500 font-medium">
              {formatCurrency(totalStats.cashCollected)}
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="p-4">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-3">
            {selectedPlatform ? "By Placement" : "By Platform"}
          </p>
          <div className="space-y-2">
            {aggregatedItems.map((item) => (
              <div key={item.name}>
                {/* Main Row */}
                <div
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    selectedPlatform
                      ? "hover:bg-white/[0.03] cursor-pointer"
                      : ""
                  }`}
                  onClick={() => {
                    if (selectedPlatform) {
                      setExpandedPlacement(
                        expandedPlacement === item.name ? null : item.name
                      );
                    } else {
                      setSelectedPlatform(item.name);
                    }
                  }}
                >
                  {/* Expand icon for placements */}
                  {selectedPlatform && (
                    <div className="w-4">
                      {expandedPlacement === item.name ? (
                        <ChevronDown className="w-4 h-4 text-white/40" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                  )}

                  {/* Name */}
                  <div className="w-28 flex-shrink-0">
                    <span className="text-sm text-white/80">{item.name}</span>
                  </div>

                  {/* Bar */}
                  <div className="flex-1">
                    <div className="h-6 bg-white/5 rounded overflow-hidden">
                      <div
                        className="h-full bg-green-500/60 rounded transition-all flex items-center"
                        style={{
                          width: `${(item.cashCollected / maxCash) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-right">
                    <div className="w-16">
                      <span className="text-xs text-white/40 block">closes</span>
                      <span className="text-sm text-white/70">{item.closes}</span>
                    </div>
                    <div className="w-20">
                      <span className="text-xs text-white/40 block">cash</span>
                      <span className="text-sm text-green-500 font-medium">
                        {formatCurrency(item.cashCollected)}
                      </span>
                    </div>
                    <div className="w-16">
                      <span className="text-xs text-white/40 block">conv</span>
                      <span className="text-sm text-white/60">
                        {item.conversionRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {selectedPlatform && expandedPlacement === item.name && (
                  <div className="ml-8 mt-1 mb-3 pl-4 border-l border-white/10">
                    {getContentForPlacement(item.name).map((content) => (
                      <div
                        key={content.name}
                        className="flex items-center gap-4 py-2 text-sm"
                      >
                        <span className="w-40 text-white/60 truncate">
                          {content.name}
                        </span>
                        <div className="flex-1">
                          <div className="h-3 bg-white/5 rounded overflow-hidden">
                            <div
                              className="h-full bg-green-500/40 rounded"
                              style={{
                                width: `${
                                  (content.cashCollected / item.cashCollected) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="w-12 text-white/50 text-right">
                          {content.closes}
                        </span>
                        <span className="w-20 text-green-500/80 text-right">
                          {formatCurrency(content.cashCollected)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
