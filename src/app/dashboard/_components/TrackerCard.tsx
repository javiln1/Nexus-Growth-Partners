"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface TrackerCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  metrics?: {
    label: string;
    value: string;
    color?: "green" | "red" | "default";
  }[];
}

export function TrackerCard({
  title,
  description,
  href,
  icon,
  metrics,
}: TrackerCardProps) {
  return (
    <Link
      href={href}
      className="block bg-white/[0.03] border border-white/10 rounded-lg p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white/[0.05] rounded-lg">{icon}</div>
        <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
      </div>

      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-white/50 mb-4">{description}</p>

      {metrics && metrics.length > 0 && (
        <div className="flex gap-4 pt-4 border-t border-white/10">
          {metrics.map((metric, index) => (
            <div key={index}>
              <p className="text-xs text-white/40 mb-1">{metric.label}</p>
              <p
                className={`text-sm font-medium ${
                  metric.color === "green"
                    ? "text-green-500"
                    : metric.color === "red"
                    ? "text-red-500"
                    : "text-white"
                }`}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
