import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.js";
import { User, Appeal } from "../types.js";
import { Landmark, FileText, Send, User as UserIcon, Phone, FileCheck, MapPin, Upload, XCircle, Sparkles, ArrowRight } from "lucide-react";

interface CitizenPublicPortalProps {
  onAuthSuccess: (token: string, user: User) => void;
  onOpenLogin: () => void;
}

export default function CitizenPublicPortal({ onAuthSuccess, onOpenLogin }: CitizenPublicPortalProps) {
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("+998");
  const [passport, setPassport] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handlePhoneChange = (val: string) => {
    if (val.startsWith("+998")) {
      setPhone(val);
    } else if (val === "" || val === "+" || val === "+9" || val === "+99") {
      setPhone("+998");
    }
  };

  // Convert uploaded image to base64 for submission
  const handleImageUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Rasm hajmi 10MB dan oshmasligi kerak.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Image(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

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
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    setBase64Image(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!firstName || !lastName || !phone || !passport || !description || !address) {
      setError("Iltimos, barcha majburiy maydonlarni to'ldiring.");
      setLoading(false);
      return;
    }

    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/appeals/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          patronymic,
          phone,
          passport,
          description,
          address,
          imageUrl: base64Image
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Murojaatni yuborishda xatolik yuz berdi.");
      }

      // Automatically store token and trigger success logging
      localStorage.setItem("smart_murojaat_token", data.token);
      localStorage.setItem("smart_muro_user", JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Locale text object since some terms are specific to the multi-language portal flow
  const portalT: Record<string, Record<string, string>> = {
    uz: {
      heroTitle: "Smart Murojaat",
      heroSub: "Tuman aholisi uchun tezkor va shaffof murojaatlar portali",
      intro: "Murojaat yuborish uchun tizimdan ro'yxatdan o'tish shart emas. Quyidagi formani to'ldiring va murojaatingiz avtomatik ravishda sun'iy intellekt (Gemini AI) yordamida tasniflanib, tegishli bo'limga yo'naltiriladi.",
      piiTitle: "Fuqaro málumotlari",
      appealTitle: "Murojaat tafsilotlari",
      submitBtn: "Murojaatni yuborish",
      submittingBtn: "Murojaat yuborilmoqda...",
      staffLogin: "Login",
      addressLabel: "To'liq manzilingiz / Mahalla",
      passportLabel: "Pasport seriyasi va raqami (Identifikatsiya uchun)",
      descLabel: "Murojaatingiz matni (Muammoning to'liq tárifi)"
    },
    kaa: {
      heroTitle: "Smart Murojaat",
      heroSub: "Rayon xalqı ushın tezkar hám ashıq-aydın múrájatlar portalı",
      intro: "Múrájat jiberiw ushın dizimnen ótiw shart emes. Tómendegi kórsetpelerdi toldırıń hám múrájatińiz avtomat túrde jasalma intellekt (Gemini AI) kómeginde klassifikaciyalanıp, tiyisli bólimge jiberiledi.",
      piiTitle: "Puqara maǵliwmatları",
      appealTitle: "Múrájat tolıq maliwmatları",
      submitBtn: "Отправить запрос",
      submittingBtn: "Múrájat jiberilmekte...",
      staffLogin: "Login",
      addressLabel: "Tolıq manzilińiz / Máhálle",
      passportLabel: "Pasport seriyası hám sanı (Identifikatsiya ushın)",
      descLabel: "Múrájatińiz (Mashqalanıń tolıq táriypii)"
    },
    ru: {
      heroTitle: "Интеллектуальный запрос",
      heroSub: "Быстрый и прозрачный портал для подачи запросов и жалоб жителями района.",
      intro: "Для отправки запроса регистрироваться в системе не нужно. Просто заполните приведенную ниже форму — ваш запрос будет автоматически классифицирован с помощью искусственного интеллекта (Gemini AI) и направлен в соответствующий отдел.",
      piiTitle: "Сведения о гражданине",
      appealTitle: "Детали обращения",
      submitBtn: "Отправить обращение",
      submittingBtn: "Отправка запроса...",
      staffLogin: "Авторизоваться",
      addressLabel: "Полный адрес / Район",
      passportLabel: "Серия и номер паспорта (для идентификации)",
      descLabel: "Текст вашего запроса (полное описание проблемы)"
    },
    en: {
      heroTitle: "Smart Inquiry",
      heroSub: "Fast and Transparent Citizen Appeals Portal for District Hokimiyat",
      intro: "No prior registration or login required. Simply fill in the form below. Your appeal will be automatically classified by Gemini AI and routed directly to the responsible municipal department.",
      piiTitle: "Citizen Personal Information",
      appealTitle: "Appeal Statement Details",
      submitBtn: "Submit Citizen Appeal",
      submittingBtn: "Submitting Statement...",
      staffLogin: "Login",
      addressLabel: "Exact Address / Mahalla",
      passportLabel: "Passport Series & Number (For Identification)",
      descLabel: "Appeal description (Detailed statement of the issue)"
    }
  };

  const pt = portalT[language] || portalT["uz"];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Dynamic Header / Lang Toggle Row */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-slate-400 leading-none">SHOMANAY DISTRICT</span>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Smart Murojaat</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language select buttons */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(["uz", "kaa", "ru", "en"] as const).map(lng => (
              <button
                key={lng}
                onClick={() => setLanguage(lng)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer uppercase ${
                  language === lng ? "bg-white text-blue-600 shadow-3xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {lng}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenLogin}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/75 hover:bg-blue-50 px-3.5 py-1.5 rounded-lg cursor-pointer transition"
          >
            {pt.staffLogin}
          </button>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Automated Triage</span>
          </div>
          <h2 className="text-2xl md:text-3.5xl font-bold text-slate-950 tracking-tight leading-none">
            {pt.heroSub}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {pt.intro}
          </p>
        </div>
      </div>

      {/* Main Submission Form Block */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Yangi murojaat yuborish formasi</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Barcha * bilan belgilangan maydonlar to'ldirilishi shart.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium leading-relaxed animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Citizen PII details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide border-l-2 border-blue-600 pl-2">
                {pt.piiTitle}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Last Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t("auth.lastName")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Masalan: Mambetov"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t("auth.firstName")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Masalan: Ruslan"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* Patronymic */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t("auth.patronymic")}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={patronymic}
                      onChange={e => setPatronymic(e.target.value)}
                      placeholder="Masalan: Azatovich"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t("auth.phone")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="+998901234567"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition outline-hidden text-slate-950"
                    />
                  </div>
                </div>

                {/* Passport */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {pt.passportLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={passport}
                      onChange={e => setPassport(e.target.value.toUpperCase())}
                      placeholder="Masalan: KA1234567"
                      maxLength={9}
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition outline-hidden text-slate-950"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Statement Details */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide border-l-2 border-blue-600 pl-2">
                {pt.appealTitle}
              </h4>

              <div className="space-y-4">
                {/* Description Textarea */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {pt.descLabel} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Muammoingizni, qayerda sodir bo'lganini va qachondan beri mavjudligini batafsil tasvirlang..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition outline-hidden text-slate-950 placeholder-slate-400 min-h-[100px]"
                  />
                </div>

                {/* Location Address */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {pt.addressLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Masalan: G'arezshizlik ko'chasi, 12-uy yoki Qumbaz mahallasi"
                      className="pl-9 w-full rounded-lg border border-slate-200 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition outline-hidden text-slate-950 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Attachment Photo */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
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
                        id="portal-file-upload"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                      <label htmlFor="portal-file-upload" className="cursor-pointer space-y-2 block">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-[11px] font-medium text-slate-700">
                          {t("citizen.dragDrop")}
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase">
                          PNG, JPG, JPEG (Max 10MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={base64Image}
                        alt="Citizen proof"
                        className="w-full h-44 object-cover"
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
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-6 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <span>{loading ? pt.submittingBtn : pt.submitBtn}</span>
              {!loading && <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-500 py-6 px-6 text-center text-[11px] border-t border-slate-800">
        <p>© {new Date().getFullYear()} Hokimiyat - Smart Murojaat. Barcha huquqlar himoyalangan.</p>
        <p className="mt-1 text-slate-600">Secure citizen service gateway connected to regional governors dashboard.</p>
      </footer>
    </div>
  );
}
