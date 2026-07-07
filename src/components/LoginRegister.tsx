import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.js";
import { User } from "../types.js";
import { Shield, Key, Mail, Phone, Calendar, MapPin, User as UserIcon, Eye, EyeOff, Lock, Landmark, FileCheck } from "lucide-react";

interface LoginRegisterProps {
  onAuthSuccess: (token: string, user: User) => void;
  onBackToPortal?: () => void;
}

export default function LoginRegister({ onAuthSuccess, onBackToPortal }: LoginRegisterProps) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+998");
  const [dob, setDob] = useState("");
  const [region, setRegion] = useState("Nukus");
  const [address, setAddress] = useState("");
  const [passport, setPassport] = useState("");

  const regions = [
    "Nukus",
    "Kungrad",
    "Khodjeli",
    "Chimbay",
    "Ellikkala",
    "Beruni",
    "Mo'ynoq",
    "Shumanay",
    "Kanlikul",
    "Karauzyak"
  ];

  const handlePhoneChange = (val: string) => {
    // Ensure +998 is always present
    if (val.startsWith("+998")) {
      setPhone(val);
    } else if (val === "" || val === "+" || val === "+9" || val === "+99") {
      setPhone("+998");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";

    // Validate fields if registering
    if (!isLogin) {
      if (!username || !password || !firstName || !lastName || !email || !phone || !dob) {
        setError(t("auth.validation.required"));
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError(t("auth.validation.passwordMismatch"));
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(t("auth.validation.passwordLength"));
        setLoading(false);
        return;
      }
      const phoneRegex = /^\+998\d{9}$/;
      if (!phoneRegex.test(phone)) {
        setError(t("auth.validation.phoneFormat"));
        setLoading(false);
        return;
      }
    }

    try {
      const payload = isLogin
        ? { username, password }
        : {
            username,
            password,
            firstName,
            lastName,
            patronymic,
            email,
            phone,
            dob,
            region,
            address,
            passport
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Success
      localStorage.setItem("smart_murojaat_token", data.token);
      localStorage.setItem("smart_murojaat_user", JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill helper for easy testing of each role
  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setIsLogin(true);
    setError(null);
  };

  return (
    <div id="login-root" className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Emblem / Shield Accent */}
        <div className="inline-flex items-center justify-center bg-blue-600/10 text-blue-700 p-3.5 rounded-full mb-4 shadow-2xs">
          <Landmark className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto leading-normal">
          {t("app.subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-md rounded-2xl border border-slate-100 sm:px-10">
          {/* Tab Selection */}
          <div className="flex border-b border-slate-100 mb-6 pb-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`w-1/2 py-2.5 text-center font-semibold text-sm transition-all duration-150 cursor-pointer border-b-2 ${
                isLogin
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("auth.login")}
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`w-1/2 py-2.5 text-center font-semibold text-sm transition-all duration-150 cursor-pointer border-b-2 ${
                !isLogin
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("auth.register")}
            </button>
          </div>

          {error && (
            <div id="form-error" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium leading-normal animate-in fade-in duration-150">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* REGISTER PORTAL FIELDS */}
            {!isLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Last Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.lastName")} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Mambetova"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.firstName")} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Dilnoza"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* Patronymic */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.patronymic")}</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={patronymic}
                      onChange={e => setPatronymic(e.target.value)}
                      placeholder="Pulatovna"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.dob")} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.region")} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      value={region}
                      onChange={e => setRegion(e.target.value)}
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    >
                      {regions.map(r => (
                        <option key={r} value={r}>
                          {r} {r === "Nukus" ? "shahri" : "tumani"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.phone")} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="+998901234567"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.email")} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="citizen.example@mail.uz"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.address")}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="G'arezshizlik ko'chasi, 24-uy"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* Passport */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.passport")}</label>
                  <div className="relative">
                    <FileCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={passport}
                      onChange={e => setPassport(e.target.value.toUpperCase())}
                      placeholder="KA1234567"
                      maxLength={9}
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COMMON FIELDS (Username, Password) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.username")} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase())}
                    placeholder="foydalanuvchi_nomi"
                    className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.password")} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="pl-9 pr-10 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("auth.confirmPassword")} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-hidden text-slate-950"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "..." : isLogin ? t("auth.login") : t("auth.register")}
            </button>
          </form>

          {onBackToPortal && (
            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <button
                type="button"
                onClick={onBackToPortal}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 cursor-pointer transition"
              >
                ← Fuqarolar murojaat portali (Orqaga qaytish)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
