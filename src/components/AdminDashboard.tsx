import { useLanguage } from "../i18n/LanguageContext.js";
import { Appeal, Department } from "../types.js";
import { FileText, CheckCircle2, Clock, AlertTriangle, ChevronRight, Trophy, Sparkles, AlertOctagon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface AdminDashboardProps {
  stats: {
    kpis: {
      total: number;
      resolved: number;
      pending: number;
      rejected: number;
      avgResolutionHours: number;
    };
    statusCounts: Record<string, number>;
    urgencyCounts: Record<string, number>;
    categoryBreakdown: { key: string; count: number; resolved: number }[];
    regionBreakdown: { region: string; count: number; resolved: number }[];
    appealsOverTime: { date: string; submitted: number; resolved: number }[];
    oldestUnresolved: Appeal[];
    departments: Department[];
  };
  onReviewAppeal: (appeal: Appeal) => void;
}

export default function AdminDashboard({ stats, onReviewAppeal }: AdminDashboardProps) {
  const { t, language } = useLanguage();
  const kpis = stats.kpis;

  // Chart Colors config
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];
  const URGENCY_COLORS: Record<string, string> = {
    low: "#10b981",
    medium: "#3b82f6",
    high: "#f59e0b",
    critical: "#ef4444"
  };

  // Prepare data for Category Pie Chart
  const categoryChartData = stats.categoryBreakdown
    .filter(item => item.count > 0)
    .map(item => ({
      name: t(`category.${item.key}`) !== `category.${item.key}` ? t(`category.${item.key}`) : item.key,
      value: item.count
    }));

  // Prepare data for Urgency Bar Chart
  const urgencyChartData = Object.entries(stats.urgencyCounts).map(([key, count]) => ({
    name: t(`urgency.${key}`),
    count: count,
    fill: URGENCY_COLORS[key] || "#3b82f6"
  }));

  // Helper for KPI card render
  const renderKpiCard = (title: string, value: string | number, sub: string, icon: any, colorClass: string) => {
    const Icon = icon;
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between transition-transform hover:translate-y-[-2px]">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
          <p className="text-[10px] font-medium text-slate-400">{sub}</p>
        </div>
        <div className={`p-4 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    );
  };

  return (
    <div id="admin-dashboard-root" className="space-y-8 animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span>Hokimiyat Real-Time Analytics Dashboard</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Automated data streaming, AI routing efficiency indicators, and department performance metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {renderKpiCard(
          t("admin.totalAppeals"),
          kpis.total,
          "All submitted appeals",
          FileText,
          "bg-blue-50 text-blue-600"
        )}
        {renderKpiCard(
          t("admin.resolvedAppeals"),
          kpis.resolved,
          `${Math.round((kpis.resolved / (kpis.total || 1)) * 100)}% resolution efficiency`,
          CheckCircle2,
          "bg-emerald-50 text-emerald-600"
        )}
        {renderKpiCard(
          t("admin.pendingAppeals"),
          kpis.pending,
          "Awaiting action or in progress",
          Clock,
          "bg-amber-50 text-amber-600"
        )}
        {renderKpiCard(
          t("admin.avgResolution"),
          kpis.avgResolutionHours >= 24
            ? `${Math.round(kpis.avgResolutionHours / 24)} ${t("admin.days")}`
            : `${kpis.avgResolutionHours} ${t("admin.hours")}`,
          "Average SLA response time",
          Clock,
          "bg-purple-50 text-purple-600"
        )}
      </div>

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Over Time Area Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:col-span-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            {t("admin.trends")}
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.appealsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} stroke="#e2e8f0" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "0", color: "#fff", fontSize: "11px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" name={t("status.new")} dataKey="submitted" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmitted)" />
                <Area type="monotone" name={t("status.resolved")} dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgency Distribution Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 col-span-1">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            {t("admin.urgencyDistribution")}
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urgencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} stroke="#e2e8f0" />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "0", color: "#fff", fontSize: "11px" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {urgencyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown list (better and cleaner than Recharts Pie for lots of empty categories) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("admin.categoryBreakdown")}
          </h4>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
            {stats.categoryBreakdown.map((cat, idx) => {
              const percentage = kpis.total > 0 ? Math.round((cat.count / kpis.total) * 100) : 0;
              return (
                <div key={cat.key} className="flex items-center justify-between text-xs py-1">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center text-slate-700 font-medium pr-4">
                      <span>{t(`category.${cat.key}`) !== `category.${cat.key}` ? t(`category.${cat.key}`) : cat.key}</span>
                      <span className="font-semibold text-slate-900">{cat.count} appeals ({percentage}%)</span>
                    </div>
                    {/* Tiny Progress bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[idx % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Performance Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{t("admin.leaderboard")}</span>
          </h4>
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto">
            {stats.departments
              .map(d => {
                const efficiency = d.totalAssigned > 0 ? Math.round((d.totalResolved / d.totalAssigned) * 100) : 0;
                return { ...d, efficiency };
              })
              .sort((a, b) => b.efficiency - a.efficiency || b.totalResolved - a.totalResolved)
              .map((dept, idx) => (
                <div key={dept.id} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] bg-slate-100 text-slate-600 font-bold w-5 h-5 rounded-md flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-slate-900">
                        {dept.name[useLanguage().language] || dept.name["en"]}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-6">Manager: {dept.manager}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-xs font-bold text-slate-900">{dept.efficiency}%</span>
                    <p className="text-[9px] text-slate-500 font-medium">
                      {dept.totalResolved}/{dept.totalAssigned} resolved
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Oldest Unresolved Appeals Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5 text-red-600">
          <AlertOctagon className="w-4.5 h-4.5" />
          <span>{t("admin.oldestUnresolved")}</span>
        </h4>

        {stats.oldestUnresolved.length === 0 ? (
          <div className="text-center p-6 text-slate-400 text-xs">
            No unresolved appeals pending! Great job team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider pb-2">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.oldestUnresolved.map(appeal => (
                  <tr key={appeal.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">#{appeal.id.toUpperCase()}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{appeal.citizenName}</td>
                    <td className="py-3 px-4 text-slate-600">{appeal.citizenRegion || "Nukus"}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {appeal.translations?.[language]?.description || appeal.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize`} style={{
                        backgroundColor: `${URGENCY_COLORS[appeal.urgency]}15`,
                        color: URGENCY_COLORS[appeal.urgency]
                      }}>
                        {t(`urgency.${appeal.urgency}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(appeal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onReviewAppeal(appeal)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
