import { formatPercent } from "@/lib/utils";

interface ConversionRatesProps {
  rates: {
    leadToConvo: number;
    convoToBooked: number;
    showRate: number;
    closeRate: number;
  };
  funnel: {
    messages: number;
    convos: number;
    booked: number;
    closed: number;
  };
}

export function ConversionRates({ rates, funnel }: ConversionRatesProps) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Conversion Rates</h2>

      {/* Rate Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-md p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">
            {formatPercent(rates.leadToConvo)}
          </div>
          <div className="text-xs text-white/50 mt-1">Lead → Convo</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-md p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">
            {formatPercent(rates.convoToBooked)}
          </div>
          <div className="text-xs text-white/50 mt-1">Convo → Booked</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-md p-3 text-center">
          <div className="text-xl font-bold text-purple-400">
            {formatPercent(rates.showRate)}
          </div>
          <div className="text-xs text-white/50 mt-1">Show Rate</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-md p-3 text-center">
          <div className="text-xl font-bold text-green-400">
            {formatPercent(rates.closeRate)}
          </div>
          <div className="text-xs text-white/50 mt-1">Close Rate</div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-white/70 mb-3">Pipeline Funnel</h3>

        <div className="relative">
          <div
            className="h-8 bg-blue-500/30 rounded flex items-center justify-between px-3"
            style={{ width: "100%" }}
          >
            <span className="text-xs font-medium">Messages Sent</span>
            <span className="text-xs font-bold">{funnel.messages}</span>
          </div>
        </div>

        <div className="relative">
          <div
            className="h-8 bg-blue-400/30 rounded flex items-center justify-between px-3"
            style={{ width: "85%" }}
          >
            <span className="text-xs font-medium">Conversations</span>
            <span className="text-xs font-bold">{funnel.convos}</span>
          </div>
        </div>

        <div className="relative">
          <div
            className="h-8 bg-purple-400/30 rounded flex items-center justify-between px-3"
            style={{ width: "70%" }}
          >
            <span className="text-xs font-medium">Calls Booked</span>
            <span className="text-xs font-bold">{funnel.booked}</span>
          </div>
        </div>

        <div className="relative">
          <div
            className="h-8 bg-green-400/30 rounded flex items-center justify-between px-3"
            style={{ width: "55%" }}
          >
            <span className="text-xs font-medium">Deals Closed</span>
            <span className="text-xs font-bold">{funnel.closed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
