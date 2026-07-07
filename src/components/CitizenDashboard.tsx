import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.js";
import { User, Appeal, AppealStatus } from "../types.js";
import { PlusCircle, FileText, Upload, Image as ImageIcon, MapPin, CheckCircle2, AlertCircle, RefreshCw, XCircle, Landmark } from "lucide-react";

interface CitizenDashboardProps {
  user: User;
}

export default function CitizenDashboard({ user }: CitizenDashboardProps) {
  const { language, t } = useLanguage();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/appeals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("smart_murojaat_token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAppeals(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  // Convert File to Base64 String
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file." });
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setBase64Image(reader.result as string);
    };
    reader.onerror = (error) => {
      console.error("Error base64 encoding file", error);
    };
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleClearImage = () => {
    setBase64Image(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !address) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("smart_murojaat_token")}`
        },
        body: JSON.stringify({
          description,
          address,
          imageUrl: base64Image || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit appeal.");
      }

      // Success
      setMessage({ type: "success", text: t("citizen.submitSuccess") });
      setDescription("");
      setAddress("");
      setBase64Image(null);
      fetchAppeals(); // refresh list
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Status Stepper Steps config
  const steps: { key: AppealStatus; label: string }[] = [
    { key: "new", label: t("status.new") },
    { key: "under_review", label: t("status.under_review") },
    { key: "in_progress", label: t("status.in_progress") },
    { key: "resolved", label: t("status.resolved") }
  ];

  const getStepIndex = (status: AppealStatus) => {
    if (status === "rejected") return -1;
    return steps.findIndex(s => s.key === status);
  };

  return (
    <main id="citizen-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("citizen.welcome")}, {user.firstName}!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit appeals, track official reviews, and receive responses from the regional governor's office.
          </p>
        </div>
        <button
          onClick={fetchAppeals}
          disabled={refreshing}
          className="mt-4 md:mt-0 flex items-center justify-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appeal submission form column (1 block) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 sticky top-20">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <span>{t("citizen.submitTitle")}</span>
            </h3>

            {message && (
              <div className={`p-3.5 rounded-lg text-xs leading-relaxed border ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Appeal description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t("citizen.appealPlaceholder")}
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950 placeholder-slate-400"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Address / Mahalla <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder={t("citizen.addressPlaceholder")}
                    className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Attachment File Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t("citizen.attachment")}
                </label>
                {!base64Image ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      dragging
                        ? "border-blue-500 bg-blue-50/20"
                        : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/40"
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-[11px] font-medium text-slate-700">
                        {t("citizen.dragDrop")}
                      </p>
                      <p className="text-[9px] text-slate-400 uppercase">
                        PNG, JPG or JPEG up to 10MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={base64Image}
                      alt="Attachment preview"
                      className="w-full h-36 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full cursor-pointer shadow-xs"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !description || !address}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? t("citizen.submitting") : t("nav.submit")}
              </button>
            </form>
          </div>
        </div>

        {/* History column (2 blocks) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <span>{t("citizen.myAppealsTitle")} ({appeals.length})</span>
          </h3>

          {appeals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium">{t("citizen.emptyAppeals")}</p>
              <p className="text-xs text-slate-400 mt-1">Submit an appeal using the left form to see it here.</p>
            </div>
          ) : (
            appeals.map(appeal => {
              const currentStepIdx = getStepIndex(appeal.status);
              const isRejected = appeal.status === "rejected";

              return (
                <div
                  key={appeal.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs animate-in fade-in duration-200"
                >
                  {/* Top: Metadata & Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-slate-400">#{appeal.id.toUpperCase()}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium capitalize">
                        {appeal.translations?.[language]?.category || (t(`category.${appeal.category}`) !== `category.${appeal.category}` ? t(`category.${appeal.category}`) : appeal.category)}
                      </span>
                      {appeal.urgency === "critical" && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                          {t("urgency.critical")}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(appeal.createdAt).toLocaleDateString(language, { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col md:flex-row gap-5">
                    {appeal.imageUrl && (
                      <div className="w-full md:w-1/3 flex-shrink-0">
                        <img
                          src={appeal.imageUrl}
                          alt="Appeal attachment"
                          className="w-full h-36 object-cover rounded-xl border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                        {appeal.translations?.[language]?.description || appeal.description}
                      </p>
                      <div className="flex items-center space-x-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium text-slate-600">{appeal.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Extract Notification Banner */}
                  {appeal.aiSummary && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1 text-xs">
                      <div className="flex items-center space-x-1.5 text-blue-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t("citizen.aiAnalysisNotice")}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        &ldquo;{appeal.translations?.[language]?.aiSummary || appeal.aiSummary}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* STEP WIZARD STATUS TIMELINE */}
                  <div className="border-t border-b border-slate-50 py-5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                      {t("citizen.statusStepper")}
                    </h4>
                    {isRejected ? (
                      <div className="flex items-center space-x-2 bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 text-xs">
                        <XCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                        <div>
                          <p className="font-bold">{t("status.rejected")}</p>
                          <p className="text-[11px] text-red-600 mt-0.5">This appeal has been rejected or closed by Hokimiyat administration.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {steps.map((step, idx) => {
                          const isCompleted = idx <= currentStepIdx;
                          const isCurrent = idx === currentStepIdx;
                          return (
                            <div key={step.key} className="flex md:flex-col items-center gap-3 md:gap-2 flex-1 w-full text-left md:text-center">
                              <div className="flex items-center w-full">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                                  isCompleted
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-400"
                                } ${isCurrent ? "ring-4 ring-blue-50" : ""}`}>
                                  {isCompleted ? "✓" : idx + 1}
                                </div>
                                {/* Stepper connection line (horizontal on desktop) */}
                                {idx < steps.length - 1 && (
                                  <div className={`hidden md:block h-0.5 flex-1 mx-2 transition-all ${
                                    idx < currentStepIdx ? "bg-blue-600" : "bg-slate-100"
                                  }`} />
                                )}
                              </div>
                              <span className={`text-[11px] font-medium ${
                                isCurrent ? "text-blue-600 font-bold" : isCompleted ? "text-slate-800" : "text-slate-400"
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Hokim Public Response Panel */}
                  {appeal.publicResponse ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                          <Landmark className="w-4 h-4 text-blue-700" />
                          <span>{t("citizen.publicResponse")}</span>
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full uppercase">Official Seal</span>
                      </div>
                      <p className="text-xs text-blue-950 font-normal leading-relaxed whitespace-pre-line">
                        {appeal.translations?.[language]?.publicResponse || appeal.publicResponse}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
