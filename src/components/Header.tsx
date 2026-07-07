import { useState, useEffect } from "react";
import { useLanguage, Language } from "../i18n/LanguageContext.js";
import { User, Notification } from "../types.js";
import { Bell, Globe, LogOut, User as UserIcon, Check } from "lucide-react";

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Fetch citizen notifications
  useEffect(() => {
    if (user.role === "citizen") {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user.role]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("smart_murojaat_token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("smart_murojaat_token")}`
        }
      });
      if (res.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const languages: { code: Language; label: string }[] = [
    { code: "uz", label: "O'zbekcha (UZ)" },
    { code: "kaa", label: "Qaraqalpaqsha (KAA)" },
    { code: "ru", label: "Русский (RU)" },
    { code: "en", label: "English (EN)" }
  ];

  return (
    <header id="header-root" className="bg-white border-b border-slate-200 sticky top-0 z-40 h-16 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg font-bold flex items-center justify-center tracking-wider text-sm shadow-sm">
            SM
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 leading-tight tracking-tight">
              {t("app.title")}
            </h1>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              {t("app.subtitle")}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {/* i18n Globe Switcher */}
          <div className="relative">
            <button
              id="lang-btn"
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950 border border-slate-200 cursor-pointer transition-all duration-150"
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium uppercase">{language}</span>
            </button>

            {showLangMenu && (
              <div id="lang-dropdown" className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                      language === lang.code ? "text-blue-600 font-medium" : "text-slate-700"
                    }`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell (Citizen only) */}
          {user.role === "citizen" && (
            <div className="relative">
              <button
                id="notif-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowLangMenu(false);
                }}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer border border-slate-200 relative transition-all duration-150"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div id="notif-dropdown" className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">{t("nav.myAppeals")}</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} {t("status.new")}
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        {t("citizen.emptyAppeals")}
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !notif.read ? "bg-blue-50/40" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-xs text-slate-900">
                              {notif.title[language] || notif.title["en"]}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                            {notif.message[language] || notif.message["en"]}
                          </p>
                          <span className="text-[9px] text-slate-400 block mt-1.5">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User badge */}
          <div className="flex items-center space-x-2.5 border-l border-slate-200 pl-4 h-8">
            <div className="bg-slate-100 text-slate-800 w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold uppercase">
                {user.lastName[0]}
                {user.firstName[0]}
              </span>
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-semibold text-slate-900">
                {user.lastName} {user.firstName}
              </div>
              <div className="text-[10px] text-slate-400 font-medium capitalize">
                {t(`role.${user.role}`)}
              </div>
            </div>
            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all duration-150"
              title={t("auth.logout")}
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
