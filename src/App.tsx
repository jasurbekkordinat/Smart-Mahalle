import { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext.js";
import { User, Appeal } from "./types.js";
import Header from "./components/Header.js";
import Sidebar from "./components/Sidebar.js";
import LoginRegister from "./components/LoginRegister.js";
import CitizenPublicPortal from "./components/CitizenPublicPortal.js";
import CitizenDashboard from "./components/CitizenDashboard.js";
import AdminDashboard from "./components/AdminDashboard.js";
import AdminAppeals from "./components/AdminAppeals.js";
import AdminDepartments from "./components/AdminDepartments.js";
import AppealDetailModal from "./components/AppealDetailModal.js";
import AIChatWidget from "./components/AIChatWidget.js";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { t } = useLanguage();
  const [token, setToken] = useState<string | null>(localStorage.getItem("smart_murojaat_token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Tab State for Admin
  const [activeTab, setActiveTab] = useState("stats");

  // Admin Data states
  const [allAppeals, setAllAppeals] = useState<Appeal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);

  // Filters State for Admin Appeals tab
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [urgency, setUrgency] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    validateSession();
  }, [token]);

  const validateSession = async () => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        if (userData.role !== "citizen") {
          // Fetch initial admin datasets
          fetchAdminDatasets();
        }
      } else {
        // Clear stale token
        handleLogout();
      }
    } catch (e) {
      console.error(e);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminDatasets = async () => {
    try {
      // 1. Fetch appeals list with filter queries
      const queryParams = new URLSearchParams();
      if (category) queryParams.set("category", category);
      if (status) queryParams.set("status", status);
      if (urgency) queryParams.set("urgency", urgency);
      if (region) queryParams.set("region", region);
      if (search) queryParams.set("search", search);

      const [appealsRes, statsRes] = await Promise.all([
        fetch(`/api/appeals?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("smart_murojaat_token")}` }
        }),
        fetch("/api/stats", {
          headers: { Authorization: `Bearer ${localStorage.getItem("smart_murojaat_token")}` }
        })
      ]);

      if (appealsRes.ok && statsRes.ok) {
        const appealsData = await appealsRes.json();
        const statsData = await statsRes.json();
        setAllAppeals(appealsData);
        setStats(statsData);
      }
    } catch (e) {
      console.error("Failed to fetch admin datasets", e);
    }
  };

  // Re-fetch when filter queries change on the admin list
  useEffect(() => {
    if (user && user.role !== "citizen") {
      fetchAdminDatasets();
    }
  }, [category, status, urgency, region, search]);

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("smart_murojaat_token");
    localStorage.removeItem("smart_muro_user");
    setToken(null);
    setUser(null);
  };

  const handleReviewAppeal = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
  };

  const handleUpdateSuccess = () => {
    fetchAdminDatasets(); // Refresh list and stats after edit
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
          Verifying secure credentials...
        </p>
      </div>
    );
  }

  // Not Logged In -> Show Public Portal or Login View
  if (!user) {
    if (showLogin) {
      return (
        <>
          <LoginRegister
            onAuthSuccess={handleAuthSuccess}
            onBackToPortal={() => setShowLogin(false)}
          />
          <AIChatWidget />
        </>
      );
    }
    return (
      <>
        <CitizenPublicPortal
          onAuthSuccess={handleAuthSuccess}
          onOpenLogin={() => setShowLogin(true)}
        />
        <AIChatWidget />
      </>
    );
  }

  // Logged In -> Citizen Perspective
  if (user.role === "citizen") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header user={user} onLogout={handleLogout} />
        <CitizenDashboard user={user} />
        <AIChatWidget />
      </div>
    );
  }

  // Logged In -> Admin & Super Admin (Hokim) Perspective
  const pendingCount = stats?.kpis?.pending || allAppeals.filter(a => a.status !== "resolved" && a.status !== "rejected").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Main Navigation Header */}
      <Header user={user} onLogout={handleLogout} />

      <div className="flex flex-1">
        {/* Sidebar Panel */}
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingCount}
        />

        {/* Dashboard contents */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === "stats" && stats && (
            <AdminDashboard stats={stats} onReviewAppeal={handleReviewAppeal} />
          )}

          {activeTab === "appeals" && (
            <AdminAppeals
              appeals={allAppeals}
              onReviewAppeal={handleReviewAppeal}
              filters={{
                category,
                setCategory,
                status,
                setStatus,
                urgency,
                setUrgency,
                region,
                setRegion,
                search,
                setSearch
              }}
            />
          )}

          {activeTab === "departments" && (
            <AdminDepartments
              departments={stats?.departments || []}
              appeals={allAppeals}
              onReviewAppeal={handleReviewAppeal}
            />
          )}
        </div>
      </div>

      {/* Review Complaint Modal Overlay */}
      {selectedAppeal && (
        <AppealDetailModal
          appeal={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}

      <AIChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
