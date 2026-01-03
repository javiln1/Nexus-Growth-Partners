"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import {
  ClipboardList,
  Loader2,
  CheckCircle,
  Send,
  Phone,
  MessageSquare,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  submitSetterReport,
  submitCloserReport,
  type SetterFormData,
  type CloserFormData,
} from "../submit-eod/actions";

interface EODSubmitFormProps {
  userName: string;
  role: "setter" | "closer";
  teamMemberName: string;
  teamMemberId: string | null;
  clientId: string;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function EODSubmitForm({
  userName,
  role,
  teamMemberName,
  teamMemberId,
  clientId,
}: EODSubmitFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setter form state
  const [setterData, setSetterData] = useState({
    report_date: getToday(),
    // Activity
    dials: 0,
    leads_texted: 0,
    outbound_dms_sent: 0,
    pickups: 0,
    text_responses: 0,
    outbound_dm_responses: 0,
    inbound_dms: 0,
    conversations: 0,
    followups_sent: 0,
    // Bookings
    calls_booked_dials: 0,
    calls_booked_dms: 0,
    live_transfers: 0,
    // Recovery
    noshows_reached: 0,
    noshows_rebooked: 0,
    old_applicants_called: 0,
    old_applicants_rebooked: 0,
    cancellations_called: 0,
    cancellations_rebooked: 0,
    // Revenue
    cash_collected: 0,
    revenue_generated: 0,
    // Qualitative
    key_wins: "",
    main_challenges: "",
    improvements: "",
  });

  // Closer form state
  const [closerData, setCloserData] = useState({
    report_date: getToday(),
    // Calls
    calls_on_calendar: 0,
    shows: 0,
    no_shows: 0,
    reschedules: 0,
    followups_booked: 0,
    // Pipeline
    deals_dqd: 0,
    hot_prospects: 0,
    warm_prospects: 0,
    // Call Details
    primary_objections: "",
    call_types: "",
    // Revenue
    deals_closed: 0,
    cash_collected: 0,
    revenue_generated: 0,
    // Qualitative
    key_wins: "",
    main_challenges: "",
    improvements: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    let result;

    if (role === "setter") {
      const payload: SetterFormData = {
        client_id: clientId,
        team_member_id: teamMemberId,
        member_name: teamMemberName,
        ...setterData,
      };
      result = await submitSetterReport(payload);
    } else {
      const payload: CloserFormData = {
        client_id: clientId,
        team_member_id: teamMemberId,
        member_name: teamMemberName,
        ...closerData,
      };
      result = await submitCloserReport(payload);
    }

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      setSubmitted(true);
      setTimeout(() => {
        router.push(
          role === "setter" ? "/dashboard/setter" : "/dashboard/closer-personal"
        );
      }, 1500);
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm text-white focus:outline-none focus:border-white/40 transition-colors";
  const labelClass = "block text-xs font-medium text-white/60 mb-1.5";
  const textareaClass =
    "w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm text-white focus:outline-none focus:border-white/40 transition-colors min-h-[80px] resize-y";

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar userName={userName} />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold">Report Submitted!</h2>
            <p className="text-white/60">Redirecting to your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar userName={userName} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {role === "setter" ? "Setter" : "Closer"} EOD Report
              </h1>
              <p className="text-sm text-white/50">{teamMemberName}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
            <div className="max-w-[200px]">
              <label className={labelClass}>Report Date</label>
              <input
                type="date"
                value={role === "setter" ? setterData.report_date : closerData.report_date}
                onChange={(e) =>
                  role === "setter"
                    ? setSetterData((p) => ({ ...p, report_date: e.target.value }))
                    : setCloserData((p) => ({ ...p, report_date: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          {role === "setter" ? (
            <>
              {/* Activity Metrics */}
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Activity Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "dials", label: "Dials" },
                    { key: "leads_texted", label: "Leads Texted" },
                    { key: "outbound_dms_sent", label: "Outbound DMs" },
                    { key: "pickups", label: "Pickups" },
                    { key: "text_responses", label: "Text Responses" },
                    { key: "outbound_dm_responses", label: "DM Responses" },
                    { key: "inbound_dms", label: "Inbound DMs" },
                    { key: "conversations", label: "Conversations" },
                    { key: "followups_sent", label: "Follow-ups Sent" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className={labelClass}>{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={setterData[key as keyof typeof setterData]}
                        onChange={(e) =>
                          setSetterData((p) => ({
                            ...p,
                            [key]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Metrics */}
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Booking Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "calls_booked_dials", label: "Booked (Dials)" },
                    { key: "calls_booked_dms", label: "Booked (DMs)" },
                    { key: "live_transfers", label: "Live Transfers" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className={labelClass}>{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={setterData[key as keyof typeof setterData]}
                        onChange={(e) =>
                          setSetterData((p) => ({
                            ...p,
                            [key]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recovery Metrics */}
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Recovery Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "noshows_reached", label: "No-Shows Reached" },
                    { key: "noshows_rebooked", label: "No-Shows Rebooked" },
                    { key: "old_applicants_called", label: "Old Apps Called" },
                    { key: "old_applicants_rebooked", label: "Old Apps Rebooked" },
                    { key: "cancellations_called", label: "Cancels Called" },
                    { key: "cancellations_rebooked", label: "Cancels Rebooked" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className={labelClass}>{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={setterData[key as keyof typeof setterData]}
                        onChange={(e) =>
                          setSetterData((p) => ({
                            ...p,
                            [key]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Revenue
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Cash Collected ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={setterData.cash_collected}
                      onChange={(e) =>
                        setSetterData((p) => ({
                          ...p,
                          cash_collected: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Revenue Generated ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={setterData.revenue_generated}
                      onChange={(e) =>
                        setSetterData((p) => ({
                          ...p,
                          revenue_generated: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Closer: Call Metrics */}
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Call Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "calls_on_calendar", label: "On Calendar" },
                    { key: "shows", label: "Shows" },
                    { key: "no_shows", label: "No Shows" },
                    { key: "reschedules", label: "Reschedules" },
                    { key: "followups_booked", label: "Follow-ups Booked" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className={labelClass}>{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={closerData[key as keyof typeof closerData]}
                        onChange={(e) =>
                          setCloserData((p) => ({
                            ...p,
                            [key]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Closer: Pipeline Metrics */}
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Target className="w-4 h-4" /> Pipeline Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "deals_dqd", label: "Deals DQ'd" },
                    { key: "hot_prospects", label: "Hot Prospects" },
                    { key: "warm_prospects", label: "Warm Prospects" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className={labelClass}>{label}</label>
                      <input
                        type="number"
                        min="0"
                        value={closerData[key as keyof typeof closerData]}
                        onChange={(e) =>
                          setCloserData((p) => ({
                            ...p,
                            [key]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Closer: Call Details */}
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Call Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Primary Objections</label>
                    <textarea
                      value={closerData.primary_objections}
                      onChange={(e) =>
                        setCloserData((p) => ({
                          ...p,
                          primary_objections: e.target.value,
                        }))
                      }
                      placeholder="Main objections encountered..."
                      className={textareaClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Call Types / Notes</label>
                    <textarea
                      value={closerData.call_types}
                      onChange={(e) =>
                        setCloserData((p) => ({
                          ...p,
                          call_types: e.target.value,
                        }))
                      }
                      placeholder="Types of calls taken..."
                      className={textareaClass}
                    />
                  </div>
                </div>
              </div>

              {/* Closer: Revenue */}
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Revenue
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Deals Closed</label>
                    <input
                      type="number"
                      min="0"
                      value={closerData.deals_closed}
                      onChange={(e) =>
                        setCloserData((p) => ({
                          ...p,
                          deals_closed: parseInt(e.target.value) || 0,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Cash Collected ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={closerData.cash_collected}
                      onChange={(e) =>
                        setCloserData((p) => ({
                          ...p,
                          cash_collected: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Revenue Generated ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={closerData.revenue_generated}
                      onChange={(e) =>
                        setCloserData((p) => ({
                          ...p,
                          revenue_generated: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Reflections (Both roles) */}
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6">
            <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Reflections
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Key Wins</label>
                <textarea
                  value={role === "setter" ? setterData.key_wins : closerData.key_wins}
                  onChange={(e) =>
                    role === "setter"
                      ? setSetterData((p) => ({ ...p, key_wins: e.target.value }))
                      : setCloserData((p) => ({ ...p, key_wins: e.target.value }))
                  }
                  placeholder="What went well today?"
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Main Challenges</label>
                <textarea
                  value={
                    role === "setter"
                      ? setterData.main_challenges
                      : closerData.main_challenges
                  }
                  onChange={(e) =>
                    role === "setter"
                      ? setSetterData((p) => ({ ...p, main_challenges: e.target.value }))
                      : setCloserData((p) => ({ ...p, main_challenges: e.target.value }))
                  }
                  placeholder="What obstacles did you face?"
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Areas for Improvement</label>
                <textarea
                  value={
                    role === "setter" ? setterData.improvements : closerData.improvements
                  }
                  onChange={(e) =>
                    role === "setter"
                      ? setSetterData((p) => ({ ...p, improvements: e.target.value }))
                      : setCloserData((p) => ({ ...p, improvements: e.target.value }))
                  }
                  placeholder="What will you improve tomorrow?"
                  className={textareaClass}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
