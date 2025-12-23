interface StatCardProps {
  label: string;
  value: string | number;
  color?: "green" | "red" | "default";
}

const colorClasses = {
  green: "text-green-500",
  red: "text-red-500",
  default: "text-white",
};

export function StatCard({ label, value, color = "default" }: StatCardProps) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-md p-3 sm:p-4 text-center min-w-0">
      <div className={`text-xl sm:text-2xl font-semibold ${colorClasses[color]} truncate`}>{value}</div>
      <div className="text-[10px] sm:text-xs text-white/40 mt-1 leading-tight">{label}</div>
    </div>
  );
}
