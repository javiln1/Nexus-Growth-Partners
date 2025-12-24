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
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-md p-2 sm:p-3 text-center min-w-0">
      <div className={`text-lg sm:text-xl font-semibold ${colorClasses[color]} truncate`}>{value}</div>
      <div className="text-[9px] sm:text-[10px] text-white/40 mt-1 whitespace-nowrap truncate">{label}</div>
    </div>
  );
}
