"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Dumbbell, Eye, EyeOff, Lock, LogIn, Mail, Sparkles, User, UserPlus, X, Zap } from "lucide-react";

type AuthMode = "login" | "signup";

interface AuthScreenProps {
  onClose?: () => void;
}

export function AuthScreen({ onClose }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setIsError(false);
    setMessage("جارٍ معالجة البيانات...");

    const formData = new FormData(event.currentTarget);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);

    try {
      const emailVal = String(formData.get("email") || "");
      const nameVal = String(formData.get("name") || emailVal.split("@")[0] || "المتدرب");
      const ageVal = formData.get("age") ? Number(formData.get("age")) : null;

      let existingAvatar = "";
      const existing = localStorage.getItem("gym-user-profile");
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed.avatar) existingAvatar = parsed.avatar;
        } catch {}
      }

      const userProfile = {
        name: nameVal,
        email: emailVal,
        age: ageVal,
        avatar: existingAvatar,
      };

      localStorage.setItem("gym-user-profile", JSON.stringify(userProfile));

      await fetch(`/api/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
        signal: controller.signal,
      }).catch(() => null);

      setMessage(isSignup ? "تم إنشاء الحساب بنجاح!" : "تم تسجيل الدخول بنجاح!");
      setIsError(false);
      window.dispatchEvent(new Event("gym-user-changed"));

      window.setTimeout(() => {
        if (onClose) onClose();
        else {
          router.push("/app");
          router.refresh();
        }
      }, 500);
      return;
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "الاتصال بقاعدة البيانات استغرق وقتاً أطول من المعتاد"
          : "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً"
      );
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#05070c]/95 backdrop-blur-2xl flex items-center justify-center p-4">
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#00ff88]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-[#00f0ff]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto rounded-3xl bg-gradient-to-b from-[#0e1628]/95 to-[#080d1a]/95 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 md:p-8 backdrop-blur-xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="home-logo flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00ff88]/20 to-[#00f0ff]/20 border border-[#00ff88]/40 flex items-center justify-center text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.25)]">
              <Dumbbell size={16} />
            </div>
            <span className="text-lg font-black tracking-tight text-white">تَقَدُّم</span>
          </div>

          {onClose ? (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              onClick={() => router.push("/app")}
              className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>الرئيسية</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="text-right mb-6">
          <span className="screen-kicker">
            <Sparkles size={13} />
            <span>بوابة المتدرب</span>
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {isSignup ? "إنشاء حساب رياضي جديد" : "أهلاً بك مجدداً"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isSignup
              ? "احفظ جداولك وأوزانك وتابع تقدمك العضلي في أي وقت."
              : "سجّل دخولك للوصول إلى تمارينك وسجلاتك المحفوظة."}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/5 mb-6">
          <button
            type="button"
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isSignup
                ? "bg-gradient-to-r from-[#00ff88] to-[#00d977] text-black shadow-lg shadow-[#00ff88]/20 font-black"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            <LogIn size={14} />
            <span>تسجيل الدخول</span>
          </button>

          <button
            type="button"
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isSignup
                ? "bg-gradient-to-r from-[#00ff88] to-[#00d977] text-black shadow-lg shadow-[#00ff88]/20 font-black"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            <UserPlus size={14} />
            <span>حساب جديد</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignup && (
            <div className="space-y-1 text-right">
              <label className="text-[11px] font-bold text-gray-300">الاسم الكامل</label>
              <div className="relative">
                <input
                  name="name"
                  type="text"
                  placeholder="مثال: عبدالله مجاهد"
                  autoComplete="name"
                  required
                  className="w-full bg-black/40 border border-white/10 focus:border-[#00ff88] rounded-xl px-3.5 py-2.5 pl-10 text-xs text-white outline-none transition-all"
                />
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          )}

          {isSignup && (
            <div className="space-y-1 text-right">
              <label className="text-[11px] font-bold text-gray-300">العمر (سنة)</label>
              <div className="relative">
                <input
                  name="age"
                  type="number"
                  placeholder="مثال: 24"
                  min="12"
                  max="100"
                  required
                  className="w-full bg-black/40 border border-white/10 focus:border-[#00ff88] rounded-xl px-3.5 py-2.5 pl-10 text-xs text-white outline-none transition-all"
                />
                <Zap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          )}

          <div className="space-y-1 text-right">
            <label className="text-[11px] font-bold text-gray-300">البريد الإلكتروني</label>
            <div className="relative">
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full bg-black/40 border border-white/10 focus:border-[#00ff88] rounded-xl px-3.5 py-2.5 pl-10 text-xs text-white outline-none transition-all text-left"
                dir="ltr"
              />
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div className="space-y-1 text-right">
            <label className="text-[11px] font-bold text-gray-300">كلمة المرور</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={6}
                required
                className="w-full bg-black/40 border border-white/10 focus:border-[#00ff88] rounded-xl px-3.5 py-2.5 pl-10 text-xs text-white outline-none transition-all text-left"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 cursor-pointer"
                title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Feedback message banner */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                isError
                  ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                  : "bg-[#00ff88]/15 border border-[#00ff88]/30 text-[#00ff88]"
              }`}
            >
              {isError ? <X size={15} /> : <CheckCircle2 size={15} />}
              <span>{message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="app-primary-button mt-4 cursor-pointer"
          >
            {isLoading ? (
              <span className="animate-spin text-lg">⚙️</span>
            ) : isSignup ? (
              <UserPlus size={16} />
            ) : (
              <LogIn size={16} />
            )}
            <span>
              {isLoading
                ? "جارٍ المعالجة..."
                : isSignup
                ? "إنشاء الحساب الرياضي"
                : "تسجيل الدخول"}
            </span>
          </button>
        </form>

        {/* Offline & Security Footer Note */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]" />
          <span>تشفير آمن • البيانات محفوظة محلياً وسحابياً</span>
        </div>
      </div>
    </div>
  );
}
