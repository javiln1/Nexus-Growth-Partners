"use client";

import { useState, useTransition } from "react";
import { X, Check, XCircle, Clock, ThumbsDown } from "lucide-react";
import type { ScheduledCall } from "@/types/database";
import { saveOutcome } from "@/lib/actions/outcomes";
import { formatCurrency } from "@/lib/utils";

type OutcomeType = "close" | "no_show" | "follow_up" | "deal_lost";

interface OutcomeModalProps {
  call: ScheduledCall;
  clientId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const outcomeOptions: { value: OutcomeType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "close", label: "Close", icon: <Check className="w-5 h-5" />, color: "bg-green-500" },
  { value: "no_show", label: "No Show", icon: <XCircle className="w-5 h-5" />, color: "bg-red-500" },
  { value: "follow_up", label: "Follow Up", icon: <Clock className="w-5 h-5" />, color: "bg-blue-500" },
  { value: "deal_lost", label: "Deal Lost", icon: <ThumbsDown className="w-5 h-5" />, color: "bg-gray-500" },
];

export function OutcomeModal({ call, clientId, onClose, onSubmitted }: OutcomeModalProps) {
  const [outcomeType, setOutcomeType] = useState<OutcomeType | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Close form fields
  const [cashCollected, setCashCollected] = useState<number>(0);
  const [packageTotal, setPackageTotal] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"pif" | "payment_plan">("pif");
  const [paymentMonths, setPaymentMonths] = useState<number>(3);
  const [amountPerPeriod, setAmountPerPeriod] = useState<number>(0);
  const [currentSituation, setCurrentSituation] = useState("");
  const [desiredSituation, setDesiredSituation] = useState("");
  const [obstacles, setObstacles] = useState("");

  // No Show / Deal Lost fields
  const [reason, setReason] = useState("");

  // Follow Up fields
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");
  const [depositAmount, setDepositAmount] = useState<number>(0);

  const handleSubmit = async () => {
    if (!outcomeType) return;

    setError(null);

    startTransition(async () => {
      const result = await saveOutcome({
        clientId,
        scheduledCallId: call.id,
        leadName: call.lead_name,
        leadEmail: call.lead_email,
        leadPhone: call.lead_phone,
        outcomeType,
        outcomeDate: call.call_date,
        closerName: call.closer_name,
        setterName: call.setter_name,
        // Close fields
        cashCollected: outcomeType === "close" ? cashCollected : 0,
        packageTotal: outcomeType === "close" ? packageTotal : 0,
        paymentType: outcomeType === "close" ? paymentType : null,
        paymentMonths: outcomeType === "close" && paymentType === "payment_plan" ? paymentMonths : null,
        amountPerPeriod: outcomeType === "close" && paymentType === "payment_plan" ? amountPerPeriod : null,
        currentSituation: outcomeType === "close" ? currentSituation : null,
        desiredSituation: outcomeType === "close" ? desiredSituation : null,
        obstacles: outcomeType === "close" ? obstacles : null,
        // No Show / Deal Lost
        reason: ["no_show", "deal_lost"].includes(outcomeType) ? reason : null,
        // Follow Up
        followUpDate: outcomeType === "follow_up" ? followUpDate : null,
        followUpReason: outcomeType === "follow_up" ? followUpReason : null,
        depositAmount: outcomeType === "follow_up" ? depositAmount : 0,
      });

      if (result.success) {
        onSubmitted();
      } else {
        setError(result.error || "Failed to save outcome");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Log Outcome</h2>
            <p className="text-sm text-white/50">{call.lead_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead Info (Read-only) */}
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Lead Info</p>
            <p className="font-medium">{call.lead_name}</p>
            {call.lead_email && <p className="text-sm text-white/50">{call.lead_email}</p>}
            {call.investment_min && (
              <p className="text-sm text-green-400 mt-1">
                Investment: {formatCurrency(call.investment_min)}
                {call.investment_max && call.investment_max !== call.investment_min && ` - ${formatCurrency(call.investment_max)}`}
              </p>
            )}
          </div>

          {/* Outcome Selection */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">What was the outcome?</p>
            <div className="grid grid-cols-2 gap-2">
              {outcomeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setOutcomeType(option.value)}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    outcomeType === option.value
                      ? `${option.color} text-white border-transparent`
                      : "bg-white/[0.03] border-white/10 hover:border-white/20"
                  }`}
                >
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Fields based on outcome type */}
          {outcomeType === "close" && (
            <div className="space-y-4">
              <p className="text-xs text-white/40 uppercase tracking-wider">Deal Details</p>

              {/* Cash & Package */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Cash Collected</label>
                  <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
                    <span className="text-white/30">$</span>
                    <input
                      type="number"
                      value={cashCollected || ""}
                      onChange={(e) => setCashCollected(Number(e.target.value))}
                      className="bg-transparent w-full ml-1 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Package Total</label>
                  <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
                    <span className="text-white/30">$</span>
                    <input
                      type="number"
                      value={packageTotal || ""}
                      onChange={(e) => setPackageTotal(Number(e.target.value))}
                      className="bg-transparent w-full ml-1 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Payment Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentType("pif")}
                    className={`flex-1 py-2 rounded-lg border transition-colors ${
                      paymentType === "pif"
                        ? "bg-green-500 text-black border-transparent"
                        : "bg-white/[0.04] border-white/10 hover:border-white/20"
                    }`}
                  >
                    PIF (Paid in Full)
                  </button>
                  <button
                    onClick={() => setPaymentType("payment_plan")}
                    className={`flex-1 py-2 rounded-lg border transition-colors ${
                      paymentType === "payment_plan"
                        ? "bg-green-500 text-black border-transparent"
                        : "bg-white/[0.04] border-white/10 hover:border-white/20"
                    }`}
                  >
                    Payment Plan
                  </button>
                </div>
              </div>

              {/* Payment Plan Details */}
              {paymentType === "payment_plan" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1.5"># of Months</label>
                    <input
                      type="number"
                      value={paymentMonths}
                      onChange={(e) => setPaymentMonths(Number(e.target.value))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1.5">Amount per Period</label>
                    <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
                      <span className="text-white/30">$</span>
                      <input
                        type="number"
                        value={amountPerPeriod || ""}
                        onChange={(e) => setAmountPerPeriod(Number(e.target.value))}
                        className="bg-transparent w-full ml-1 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lead Situation */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Current Situation</label>
                  <textarea
                    value={currentSituation}
                    onChange={(e) => setCurrentSituation(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                    placeholder="Where are they now?"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Desired Situation</label>
                  <textarea
                    value={desiredSituation}
                    onChange={(e) => setDesiredSituation(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                    placeholder="Where do they want to be?"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Obstacles / Pain Points</label>
                  <textarea
                    value={obstacles}
                    onChange={(e) => setObstacles(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                    placeholder="What's holding them back?"
                  />
                </div>
              </div>
            </div>
          )}

          {outcomeType === "no_show" && (
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Reason for No Show</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20 resize-none"
                rows={3}
                placeholder="Why didn't they show up?"
              />
            </div>
          )}

          {outcomeType === "follow_up" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Follow Up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Deposit Amount</label>
                  <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
                    <span className="text-white/30">$</span>
                    <input
                      type="number"
                      value={depositAmount || ""}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="bg-transparent w-full ml-1 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Follow Up Reason</label>
                <textarea
                  value={followUpReason}
                  onChange={(e) => setFollowUpReason(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20 resize-none"
                  rows={3}
                  placeholder="Why is this a follow up?"
                />
              </div>
            </div>
          )}

          {outcomeType === "deal_lost" && (
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Reason for Lost Deal</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/20 resize-none"
                rows={3}
                placeholder="Why did we lose this deal?"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!outcomeType || isPending}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              outcomeType && !isPending
                ? "bg-green-500 text-black hover:bg-green-400"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            {isPending ? "Saving..." : "Save Outcome"}
          </button>
        </div>
      </div>
    </div>
  );
}
