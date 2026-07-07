import { useLanguage } from "../i18n/LanguageContext.js";
import { User } from "../types.js";
import { LayoutDashboard, FileText, Landmark, ShieldAlert, Sparkles } from "lucide-react";

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
}

export default function Sidebar({ user, activeTab, setActiveTab, pendingCount }: SidebarProps) {
  const { t } = useLanguage();

  const menuItems = [
    {
      id: "stats",
      label: t("nav.stats"),
      icon: LayoutDashboard,
      roles: ["admin", "super_admin"]
    },
    {
      id: "appeals",
      label: t("nav.appeals"),
      icon: FileText,
      roles: ["admin", "super_admin"],
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      id: "departments",
      label: t("nav.departments"),
      icon: Landmark,
      roles: ["admin", "super_admin"]
    }
  ];

  return (
    <aside id="sidebar-root" className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 min-h-screen border-r border-slate-800 hidden md:flex flex-col justify-between">
      <div className="flex flex-col">
        {/* Profile / Admin Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none tracking-tight text-white">Smart Murojaat</h1>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
              {user.role === "super_admin" ? "Hokim Admin" : "Staff Portal"}
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="px-4 mt-6 space-y-1.5">
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer border ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 border-blue-600/20 shadow-xs"
                      : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-blue-400 text-slate-950" : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Safety Notice / Gemini Status Info footer */}
      <div className="p-4 space-y-3 mt-auto border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 leading-none">Gemini AI Engine</p>
              <p className="text-xs text-green-400 font-bold mt-1">Active & Ready</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2 text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="font-semibold tracking-wider uppercase text-[9px]">Secure Goverment</span>
        </div>
      </div>
    </aside>
  );
}
