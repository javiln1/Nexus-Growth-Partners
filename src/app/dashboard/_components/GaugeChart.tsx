"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface GaugeChartProps {
  value: number;
  target: number;
  color: string;
  label: string;
}

export function GaugeChart({ value, target, color, label }: GaugeChartProps) {
  const percentage = Math.min((value / target) * 100, 100);

  const data = [
    {
      name: label,
      value: percentage,
      fill: color,
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[140px] h-[80px] overflow-hidden">
        <RadialBarChart
          width={140}
          height={140}
          cx={70}
          cy={80}
          innerRadius={50}
          outerRadius={65}
          barSize={12}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "rgba(255,255,255,0.1)" }}
            dataKey="value"
            cornerRadius={6}
          />
        </RadialBarChart>
        {/* Center text */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
      <div className="text-xs text-white/50 mt-2">
        Target: {target}
      </div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}
