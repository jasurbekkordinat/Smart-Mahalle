import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, AlertCircle, RefreshCw, HelpCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.js";

interface Message {
  role: "user" | "model";
  text: string;
}

export default function AIChatWidget() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Localization resources
  const chatT: Record<string, Record<string, string>> = {
    uz: {
      title: "Smart Yordamchi",
      sub: "Portal va kommunal masalalar bo'yicha AI maslahatchi",
      placeholder: "Xabaringizni yozing...",
      welcome: "Assalomu alaykum! Men Shomanay tumani Smart Murojaat portalining sun'iy intellekt yordamchisiman. Portal haqida yoki tuman kommunal/infratuzilma xizmatlari bo'yicha qanday savolingiz bor?",
      suggest1: "Murojaat qanday yuboriladi?",
      suggest2: "Murojaat holatlari qanday farqlanadi?",
      suggest3: "Hokimiyat qaysi sohalarga mas'ul?",
      warning: "Eslatma: Men faqat portal va tuman masalalariga doir savollarga javob bera olaman.",
      errorMsg: "Ulanishda xatolik yuz berdi. Iltimos qayta urinib ko'ring."
    },
    kaa: {
      title: "Smart Kómekshi",
      sub: "Portal ha'm kommunal mashqalalar boyınsha AI keńesgisi",
      placeholder: "Xabar jiberiń...",
      welcome: "Assalamu alaykum! Men Shomanay rayonı Smart Múrájat portalınıń jasalma intellekt kómekshisimen. Portal haqqında yamasa rayon kommunal/infratuzılma xızmetleri boyınsha qanday sorawıńız bar?",
      suggest1: "Múrájat qalay jiberiledi?",
      suggest2: "Múrájat statusları qanday parıqlanadı?",
      suggest3: "Hákimiyat qaysı tarawlarǵa juwapker?",
      warning: "Eskertiw: Men tek portal ha'm rayon máselelerine tiyisli sorawlarǵa juwap bere alaman.",
      errorMsg: "Baylanısta qátelik júz berdi. Qayta urınıp kóriń."
    },
    ru: {
      title: "Смарт Помощник",
      sub: "ИИ-консультант по порталу и коммунальным вопросам",
      placeholder: "Введите сообщение...",
      welcome: "Здравствуйте! Я виртуальный ИИ-помощник портала Смарт Мурожаат Шоманайского района. Чем я могу помочь вам в вопросах работы портала, ЖКХ или инфраструктуры района?",
      suggest1: "Как отправить обращение?",
      suggest2: "Что значат статусы обращений?",
      suggest3: "За какие сферы отвечает Хокимият?",
      warning: "Примечание: Я отвечаю только на вопросы, связанные с порталом и коммунальными услугами района.",
      errorMsg: "Ошибка соединения. Пожалуйста, попробуйте еще раз."
    },
    en: {
      title: "Smart AI Assistant",
      sub: "AI Advisor for portal usage & municipal issues",
      placeholder: "Type your message...",
      welcome: "Hello! I am the official AI assistant for the Shomanay District Smart Murojaat portal. How can I help you regarding portal features, local infrastructure, or municipal services?",
      suggest1: "How to submit an appeal?",
      suggest2: "What do the appeal statuses mean?",
      suggest3: "Which sectors is Hokimiyat responsible for?",
      warning: "Note: I can only answer questions related to this portal and local municipal duties.",
      errorMsg: "Connection error occurred. Please try again."
    }
  };

  const ct = chatT[language] || chatT["uz"];

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "model",
          text: ct.welcome,
        },
      ]);
    }
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg = textToSend.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || ct.errorMsg);
      }

      setMessages((prev) => [...prev, { role: "model", text: data.response }]);
    } catch (err: any) {
      setError(err.message || ct.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleReset = () => {
    setMessages([
      {
        role: "model",
        text: ct.welcome,
      },
    ]);
    setError(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Box Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="bg-white/15 p-2 rounded-xl text-white">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center space-x-1">
                  <span>{ct.title}</span>
                  <span className="bg-emerald-500 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-extrabold text-white">
                    ONLINE
                  </span>
                </h3>
                <p className="text-[10px] text-blue-100 mt-0.5">{ct.sub}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                title="Suhbatni tozalash"
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* System Constraint Note Banner */}
          <div className="bg-amber-50 text-amber-800 border-b border-amber-100 px-3 py-1.5 text-[9px] font-medium flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="leading-tight">{ct.warning}</span>
          </div>

          {/* Messages Stream viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none font-medium shadow-3xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-3xs"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Simulated Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-200/80 rounded-2xl rounded-bl-none p-3 text-xs flex items-center space-x-2 shadow-3xs">
                  <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-300"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-300 delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-300 delay-150"></span>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[11px] flex items-center space-x-1.5 font-medium leading-tight">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions Pills */}
          {messages.length === 1 && (
            <div className="bg-white px-4 py-2 border-t border-slate-100 flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSuggestionClick(ct.suggest1)}
                className="text-[10px] font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full cursor-pointer transition text-left flex items-center space-x-1"
              >
                <HelpCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span>{ct.suggest1}</span>
              </button>
              <button
                onClick={() => handleSuggestionClick(ct.suggest2)}
                className="text-[10px] font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full cursor-pointer transition text-left flex items-center space-x-1"
              >
                <HelpCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span>{ct.suggest2}</span>
              </button>
              <button
                onClick={() => handleSuggestionClick(ct.suggest3)}
                className="text-[10px] font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full cursor-pointer transition text-left flex items-center space-x-1"
              >
                <HelpCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span>{ct.suggest3}</span>
              </button>
            </div>
          )}

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={ct.placeholder}
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition text-slate-950 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
            AI
          </span>
        )}
      </button>
    </div>
  );
}
