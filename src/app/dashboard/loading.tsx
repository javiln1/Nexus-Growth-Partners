import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        <p className="text-white/50 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
}
