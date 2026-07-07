import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.js";
import { Appeal, Department, AppealStatus, AppealCategory, UrgencyLevel, SentimentType } from "../types.js";
import { X, User, Phone, MapPin, Calendar, FileText, CheckCircle2, AlertTriangle, ShieldAlert, Clock, Bot, Building, FileCheck } from "lucide-react";

interface AppealDetailModalProps {
  appeal: Appeal;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function AppealDetailModal({ appeal, onClose, onUpdateSuccess }: AppealDetailModalProps) {
  const { t, language } = useLanguage();
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form states
  const [status, setStatus] = useState<AppealStatus>(appeal.status);
  const [assignedDepartment, setAssignedDepartment] = useState(appeal.assignedDepartment || "");
  const [internalNotes, setInternalNotes] = useState(appeal.internalNotes || "");
  const [publicResponse, setPublicResponse] = useState(appeal.publicResponse || "");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("smart_murojaat_token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/appeals/${appeal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("smart_murojaat_token")}`
        },
        body: JSON.stringify({
          status,
          assignedDepartment,
          internalNotes,
          publicResponse,
          note: statusNote || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update appeal.");
      }

      setSuccess(true);
      setStatusNote("");
      // Notify parent to reload data
      onUpdateSuccess();
      setTimeout(onClose, 1000); // close modal on success delay
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const URGENCY_COLORS: Record<string, string> = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-red-50 text-red-700 border-red-200 animate-pulse"
  };

  const SENTIMENT_LABELS: Record<string, string> = {
    neutral: "Neutral / Fact-oriented",
    frustrated: "Frustrated / Distressed",
    angry: "Angry / Critical",
    desperate: "Desperate / Urgent Need"
  };

  const SENTIMENT_COLORS: Record<string, string> = {
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
    frustrated: "bg-yellow-50 text-yellow-700 border-yellow-200",
    angry: "bg-orange-50 text-orange-700 border-orange-200",
    desperate: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
  };

  return (
    <div id="modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div id="modal-container" className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-mono font-bold px-2 py-0.5 rounded-full">
              APPEAL #{appeal.id.toUpperCase()}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">Review Citizen Statement</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-400 hover:text-slate-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
          {/* Left Column: Appeal Details & Citizen info */}
          <div className="space-y-6">
            {/* Citizen profile card */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center space-x-1.5 text-blue-700">
                <User className="w-4 h-4" />
                <span>Citizen PII & Profile</span>
              </h4>
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Full Name</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{appeal.citizenName}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Phone</p>
                  <p className="font-semibold text-slate-900 mt-0.5 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{appeal.citizenPhone}</span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Passport (Masked)</p>
                  <p className="font-mono font-semibold text-slate-900 mt-0.5">{appeal.citizenPassportMasked || "Not Provided"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Region</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{appeal.citizenRegion || "Nukus"}</p>
                </div>
              </div>
            </div>

            {/* Appeal content description */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statement Description</h4>
              <p className="text-xs text-slate-800 leading-relaxed bg-white border border-slate-200/60 p-4 rounded-xl whitespace-pre-line font-normal">
                {appeal.translations?.[language]?.description || appeal.description}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Address: {appeal.address}</span>
              </p>

              {appeal.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 mt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider p-2 border-b border-slate-100 bg-slate-50">Attachment photo</p>
                  <a href={appeal.imageUrl} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                    <img
                      src={appeal.imageUrl}
                      alt="Citizen attachment"
                      className="w-full h-44 object-cover hover:opacity-95 transition"
                      referrerPolicy="no-referrer"
                    />
                  </a>
                </div>
              )}
            </div>

            {/* AI Analyzer extraction section */}
            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-blue-900 tracking-wide uppercase flex items-center space-x-1.5">
                <Bot className="w-4.5 h-4.5 text-blue-600" />
                <span>AI Automated Insights</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 font-semibold">Triage Category</p>
                  <span className="inline-block text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full capitalize mt-1">
                    {t(`category.${appeal.category}`) !== `category.${appeal.category}` ? t(`category.${appeal.category}`) : appeal.category}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold">Urgency Level</p>
                  <span className={`inline-block text-[11px] font-bold border px-2.5 py-0.5 rounded-full capitalize mt-1 ${URGENCY_COLORS[appeal.urgency]}`}>
                    {t(`urgency.${appeal.urgency}`)}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold">Customer Sentiment</p>
                  <span className={`inline-block text-[11px] font-bold border px-2.5 py-0.5 rounded-full capitalize mt-1 ${SENTIMENT_COLORS[appeal.sentiment] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {t(`sentiment.${appeal.sentiment}`) !== `sentiment.${appeal.sentiment}` ? t(`sentiment.${appeal.sentiment}`) : (SENTIMENT_LABELS[appeal.sentiment] || appeal.sentiment)}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold">Suggested Department</p>
                  <p className="font-semibold text-slate-800 mt-1 flex items-center space-x-1.5">
                    <Building className="w-4.5 h-4.5 text-slate-400" />
                    <span>{departments.find(d => d.id === appeal.suggestedDepartment)?.name[language] || "Utilities"}</span>
                  </p>
                </div>
              </div>

              {appeal.aiSummary && (
                <div className="bg-white p-3.5 rounded-xl border border-blue-200/60 text-xs">
                  <p className="font-bold text-blue-950 mb-1 flex items-center space-x-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span>Gemini AI Auto-Summary</span>
                  </p>
                  <p className="text-slate-700 text-[11px] leading-relaxed italic">
                    &ldquo;{appeal.translations?.[language]?.aiSummary || appeal.aiSummary}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Process forms & Audit trail */}
          <div className="space-y-6 lg:border-l lg:border-slate-100 lg:pl-8">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Process Appeal</h4>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold leading-relaxed">
                Appeal successfully processed! Redirecting...
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Status Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Workflow Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as AppealStatus)}
                  className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950 font-medium"
                >
                  <option value="new">{t("status.new")}</option>
                  <option value="under_review">{t("status.under_review")}</option>
                  <option value="in_progress">{t("status.in_progress")}</option>
                  <option value="postponed">{t("status.postponed")}</option>
                  <option value="resolved">{t("status.resolved")}</option>
                  <option value="rejected">{t("status.rejected")}</option>
                  <option value="unresolvable">{t("status.unresolvable")}</option>
                </select>
              </div>

              {/* Department Assign Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Department / Route</label>
                <select
                  value={assignedDepartment}
                  onChange={e => setAssignedDepartment(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950 font-medium"
                >
                  <option value="">Unassigned</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name[language] || d.name["en"]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  History Timeline Note <span className="text-slate-400 font-normal">(Explain why you changed status)</span>
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="e.g., Smetasi tekshirildi, kommunal xizmatlarga topshirildi"
                  className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Staff Coordination Notes <span className="text-slate-400 font-normal">(Private)</span>
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Only staff can see these notes..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950"
                />
              </div>

              {/* Public Response */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Public Response <span className="text-slate-400 font-normal">(Sent directly to Citizen)</span>
                </label>
                <textarea
                  rows={3}
                  value={publicResponse}
                  onChange={e => setPublicResponse(e.target.value)}
                  placeholder="Write the official reply from Hokimiyat. The citizen will see this instantly on their portal."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Apply Changes"}
                </button>
              </div>
            </form>

            {/* AUDIT TRAIL TIMELINE */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Audit Trail Timeline ({appeal.history.length})</span>
              </h4>
              <div className="relative border-l border-slate-100 pl-4 space-y-4 ml-2 text-xs">
                {appeal.history.map((hist, idx) => (
                  <div key={hist.id} className="relative">
                    {/* Visual dot indicator */}
                    <div className="absolute -left-[21px] top-1 bg-white border-2 border-blue-500 w-2.5 h-2.5 rounded-full" />
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900 capitalize">{hist.changedBy}</span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(hist.timestamp).toLocaleString(language, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-wide">
                        Status: <span className="text-slate-700">{hist.status.replace("_", " ")}</span>
                      </p>
                      {hist.note && (
                        <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100/60">
                          {hist.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
