"use client";

import { Loader2, Filter } from "lucide-react";
import type { TeamMember } from "@/types/database";

interface FiltersProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    memberId: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    dateFrom: string;
    dateTo: string;
    memberId: string;
  }>>;
  teamMembers: TeamMember[];
  onApply: () => void;
  isLoading: boolean;
}

export function Filters({
  filters,
  setFilters,
  teamMembers,
  onApply,
  isLoading,
}: FiltersProps) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 animate-fade-in">
      <div className="flex flex-wrap items-end gap-4">
        {/* Date From */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-white/60 mb-1.5">
            From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
            }
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm text-white focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {/* Date To */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-white/60 mb-1.5">
            To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
            }
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm text-white focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {/* Team Member */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-white/60 mb-1.5">
            Team Member
          </label>
          <select
            value={filters.memberId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, memberId: e.target.value }))
            }
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm text-white focus:outline-none focus:border-white/40 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Members</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={onApply}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 bg-white text-black font-medium rounded hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Filter className="w-4 h-4" />
          )}
          Apply
        </button>
      </div>
    </div>
  );
}
