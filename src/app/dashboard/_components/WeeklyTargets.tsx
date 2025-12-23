"use client";

import { GaugeChart } from "./GaugeChart";
import { COLORS } from "@/lib/constants";

interface WeeklyTargetsProps {
  booked: number;
  deals: number;
  targets: {
    booked: number;
    deals: number;
  };
}

export function WeeklyTargets({ booked, deals, targets }: WeeklyTargetsProps) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Weekly Target Progress</h2>
      <div className="flex justify-around items-center">
        <GaugeChart
          value={booked}
          target={targets.booked}
          color={COLORS.white}
          label="Calls Booked"
        />
        <GaugeChart
          value={deals}
          target={targets.deals}
          color={COLORS.green}
          label="Deals Closed"
        />
      </div>
    </div>
  );
}
