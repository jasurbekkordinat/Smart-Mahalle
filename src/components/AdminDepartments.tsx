import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.js";
import { Department, Appeal } from "../types.js";
import { Landmark, User, FileText, CheckCircle2, Clock, BarChart3, ChevronRight, Eye } from "lucide-react";

interface AdminDepartmentsProps {
  departments: Department[];
  appeals: Appeal[];
  onReviewAppeal: (appeal: Appeal) => void;
}

export default function AdminDepartments({ departments, appeals, onReviewAppeal }: AdminDepartmentsProps) {
  const { language, t } = useLanguage();
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // Group appeals by department
  const getAppealsByDept = (deptId: string) => {
    return appeals.filter(a => a.assignedDepartment === deptId);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "new": return "bg-slate-100 text-slate-700";
      case "under_review": return "bg-purple-100 text-purple-700";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-emerald-100 text-emerald-800";
      default: return "bg-red-100 text-red-800";
    }
  };

  return (
    <div id="admin-departments-root" className="space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Civic Departments & Workloads
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor staff performance, assign budgets, view active backlogs, and inspect division-level compliance.
        </p>
      </div>

      {/* Grid of departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const deptAppeals = getAppealsByDept(dept.id);
          const total = dept.totalAssigned || deptAppeals.length;
          const resolved = dept.totalResolved || deptAppeals.filter(a => a.status === "resolved").length;
          const pending = total - resolved;
          const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;
          const isSelected = selectedDeptId === dept.id;

          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDeptId(isSelected ? null : dept.id)}
              className={`bg-white rounded-2xl border p-6 space-y-5 transition-all shadow-2xs cursor-pointer ${
                isSelected
                  ? "ring-2 ring-blue-600 border-blue-600"
                  : "border-slate-200 hover:border-blue-400 hover:translate-y-[-2px]"
              }`}
            >
              {/* Dept title & icon */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 pr-2">
                  <h3 className="text-sm font-bold text-slate-950 leading-snug">
                    {dept.name[language] || dept.name["en"]}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-medium">
                    <User className="w-3.5 h-3.5" />
                    <span>Manager: {dept.manager}</span>
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                  isSelected ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500"
                }`}>
                  <Landmark className="w-5 h-5" />
                </div>
              </div>

              {/* Progress and KPIs */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-500 font-semibold">
                  <span>Resolution SLA</span>
                  <span className="text-slate-950 font-bold">{percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-blue-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Stat figures */}
              <div className="grid grid-cols-3 gap-2.5 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900">{total}</span>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Assigned</p>
                </div>
                <div className="space-y-0.5 border-x border-slate-200">
                  <span className="text-xs font-bold text-emerald-600">{resolved}</span>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Resolved</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-500">{pending}</span>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Pending</p>
                </div>
              </div>

              {/* Action trigger label */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 border-t border-slate-50 pt-3">
                <span>{isSelected ? "Click to collapse backlog" : "Click to view active backlog"}</span>
                <ChevronRight className={`w-4 h-4 transition-transform duration-150 ${isSelected ? "rotate-90" : ""}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected department details & specific backlog appeals table */}
      {selectedDeptId && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 animate-in slide-in-from-top-4 duration-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-950">
                Active Jurisdiction Backlog &mdash; {
                  departments.find(d => d.id === selectedDeptId)?.name[language] || "Selected Department"
                }
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The following citizen statements are currently assigned to this department:
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 font-mono font-bold px-3 py-1 rounded-full">
              {getAppealsByDept(selectedDeptId).length} Appeals
            </span>
          </div>

          {getAppealsByDept(selectedDeptId).length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Excellent! No pending appeals in this department's backlog.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider pb-2 bg-slate-50/50">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Citizen</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4">Urgency</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getAppealsByDept(selectedDeptId).map(appeal => (
                    <tr key={appeal.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-500">#{appeal.id.toUpperCase()}</td>
                      <td className="py-3 px-4 font-medium text-slate-950">{appeal.citizenName}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">{appeal.description}</td>
                      <td className="py-3 px-4 text-slate-500">{appeal.citizenRegion || "Nukus"}</td>
                      <td className="py-3 px-4 capitalize font-semibold">{t(`urgency.${appeal.urgency}`)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border ${getStatusBadgeClass(appeal.status)}`}>
                          {t(`status.${appeal.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onReviewAppeal(appeal)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold cursor-pointer"
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
          )}
        </div>
      )}
    </div>
  );
}
