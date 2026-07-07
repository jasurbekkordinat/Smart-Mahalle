import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.js";
import { Appeal, AppealCategory, AppealStatus, UrgencyLevel } from "../types.js";
import { Search, Filter, Download, ArrowUpDown, ChevronRight, Eye, AlertTriangle } from "lucide-react";

interface AdminAppealsProps {
  appeals: Appeal[];
  onReviewAppeal: (appeal: Appeal) => void;
  filters: {
    category: string;
    setCategory: (val: string) => void;
    status: string;
    setStatus: (val: string) => void;
    urgency: string;
    setUrgency: (val: string) => void;
    region: string;
    setRegion: (val: string) => void;
    search: string;
    setSearch: (val: string) => void;
  };
}

export default function AdminAppeals({ appeals, onReviewAppeal, filters }: AdminAppealsProps) {
  const { t, language } = useLanguage();

  const categories = Array.from(new Set(appeals.map(a => a.category).filter(Boolean)));

  const statuses: AppealStatus[] = ["new", "under_review", "in_progress", "postponed", "resolved", "rejected", "unresolvable"];
  const urgencies: UrgencyLevel[] = ["low", "medium", "high", "critical"];

  const URGENCY_COLORS: Record<string, string> = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-100",
    medium: "bg-blue-50 text-blue-700 border-blue-100",
    high: "bg-amber-50 text-amber-700 border-amber-100",
    critical: "bg-red-50 text-red-700 border-red-100 animate-pulse"
  };

  const STATUS_COLORS: Record<string, string> = {
    new: "bg-slate-100 text-slate-700 border-slate-200",
    under_review: "bg-purple-100 text-purple-700 border-purple-200",
    in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
    postponed: "bg-amber-100 text-amber-800 border-amber-200",
    resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-rose-100 text-rose-800 border-rose-200",
    unresolvable: "bg-red-100 text-red-800 border-red-200"
  };

  const SENTIMENT_LABELS: Record<string, string> = {
    neutral: "Neutral",
    frustrated: "Frustrated",
    angry: "Angry",
    desperate: "Desperate"
  };

  const SENTIMENT_COLORS: Record<string, string> = {
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
    frustrated: "bg-yellow-50 text-yellow-700 border-yellow-200",
    angry: "bg-orange-50 text-orange-700 border-orange-200",
    desperate: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
  };

  // Convert appeals array to CSV data string and trigger browser download
  const handleExportCSV = () => {
    if (appeals.length === 0) return;

    // Header row
    const headers = [
      "Appeal ID",
      "Citizen Name",
      "Citizen Phone",
      "Region",
      "Address",
      "Description",
      "Category",
      "Urgency",
      "Sentiment",
      "Status",
      "AI Summary",
      "Created At"
    ];

    // Map each appeal to a row
    const rows = appeals.map(a => [
      a.id,
      `"${a.citizenName.replace(/"/g, '""')}"`,
      a.citizenPhone,
      a.citizenRegion || "Nukus",
      `"${a.address.replace(/"/g, '""')}"`,
      `"${a.description.replace(/"/g, '""')}"`,
      a.category,
      a.urgency,
      a.sentiment,
      a.status,
      `"${(a.aiSummary || "").replace(/"/g, '""')}"`,
      a.createdAt
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Smart_Murojaat_Export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="admin-appeals-root" className="space-y-6 animate-in fade-in duration-200">
      {/* Top action header */}
      {/* Advanced Filters Block */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={e => filters.setSearch(e.target.value)}
              placeholder="Search citizens, ID, keyword..."
              className="pl-9 pr-4 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950 placeholder-slate-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={e => filters.setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{t(`status.${s}`)}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={e => filters.setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {t(`category.${c}`) !== `category.${c}` ? t(`category.${c}`) : c}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={filters.urgency}
              onChange={e => filters.setUrgency(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition text-slate-950"
            >
              <option value="">All Urgencies</option>
              {urgencies.map(u => (
                <option key={u} value={u}>{t(`urgency.${u}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Clear Check */}
        {(filters.search || filters.status || filters.category || filters.urgency) && (
          <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 p-2 px-3 rounded-lg">
            <span>Found {appeals.length} matches based on active filters</span>
            <button
              onClick={() => {
                filters.setSearch("");
                filters.setStatus("");
                filters.setCategory("");
                filters.setUrgency("");
              }}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Appeals Grid Table */}
      {appeals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
          <Filter className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold">No appeals found matching criteria.</p>
          <p className="text-xs mt-1">Try relaxing your search terms or filter constraints.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-4 px-6">ID / Date</th>
                  <th className="py-4 px-6">Citizen Profile</th>
                  <th className="py-4 px-6">Appeal Details</th>
                  <th className="py-4 px-6">AI Sentiment</th>
                  <th className="py-4 px-6">Urgency</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appeals.map(appeal => (
                  <tr key={appeal.id} className="hover:bg-slate-50/40 transition">
                    {/* ID / Date */}
                    <td className="py-4 px-6 space-y-1">
                      <span className="font-mono font-bold text-slate-900 block">#{appeal.id.toUpperCase()}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {new Date(appeal.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Citizen Profile */}
                    <td className="py-4 px-6 space-y-1">
                      <p className="font-semibold text-slate-900">{appeal.citizenName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{appeal.citizenPhone}</p>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center space-x-1">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span>{appeal.citizenRegion || "Nukus"}</span>
                      </p>
                    </td>

                    {/* Description & Category */}
                    <td className="py-4 px-6 max-w-sm space-y-1.5">
                      <p className="text-slate-800 line-clamp-2 leading-relaxed text-[11px]">
                        {appeal.translations?.[language]?.description || appeal.description}
                      </p>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold capitalize border border-slate-200/60">
                          {appeal.translations?.[language]?.category || (t(`category.${appeal.category}`) !== `category.${appeal.category}` ? t(`category.${appeal.category}`) : appeal.category)}
                        </span>
                        {appeal.imageUrl && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                            <span>Image attached</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sentiment Analysis */}
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold border px-2.5 py-1 rounded-full capitalize ${SENTIMENT_COLORS[appeal.sentiment] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {t(`sentiment.${appeal.sentiment}`) !== `sentiment.${appeal.sentiment}` ? t(`sentiment.${appeal.sentiment}`) : (SENTIMENT_LABELS[appeal.sentiment] || appeal.sentiment)}
                      </span>
                    </td>

                    {/* Urgency Level */}
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize border ${URGENCY_COLORS[appeal.urgency]}`}>
                        {t(`urgency.${appeal.urgency}`)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize border ${STATUS_COLORS[appeal.status]}`}>
                        {t(`status.${appeal.status}`)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onReviewAppeal(appeal)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
