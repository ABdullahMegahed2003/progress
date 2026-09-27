"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useState } from "react";
import { Activity, Award, Camera, CheckCircle2, Flame, ImagePlus, LogIn, ShieldCheck, Sparkles, UserRound, Zap } from "lucide-react";

type Account = { name: string; age: number | null; avatar: string };

function weekKey(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 1) % 7) + offset * 7);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function AccountScreen({ onLogin }: { onLogin: () => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  useEffect(() => {
    const loadProgress = window.setTimeout(() => {
      const system = localStorage.getItem("gym-system-saved");
      if (!system) return;
      const raw = localStorage.getItem(`gym-workout-${system}-${weekKey(0)}`);
      if (!raw) return;
      try {
        const days = JSON.parse(raw) as Array<{ exercises: Array<{ skipped: boolean; sets: Array<{ done: boolean }> }> }>;
        const sets = days.flatMap((day) => day.exercises.flatMap((exercise) => exercise.skipped ? [] : exercise.sets));
        setWeeklyProgress(sets.length ? Math.round((sets.filter((set) => set.done).length / sets.length) * 100) : 0);
      } catch { setWeeklyProgress(0); }
    }, 0);

    fetch("/api/profile")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setAccount(data?.profile ? { name: data.profile.name ?? "", age: data.profile.age ?? null, avatar: data.profile.avatar ?? "" } : null))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));

    return () => window.clearTimeout(loadProgress);
  }, []);

  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !account) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const avatar = String(reader.result);
      setAccount({ ...account, avatar });
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...account, avatar }) });
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="screen-content account-screen p-8 text-center animate-pulse text-gray-400">
        <p>جارٍ تحميل بيانات الحساب...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="screen-content account-screen animate-fade-in pb-8">
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#10192e] to-[#0a0f1d] border border-white/10 text-center shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00ff88]/20 to-[#00f0ff]/20 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
            <UserRound size={36} />
          </div>

          <span className="screen-kicker">حساب المتدرب</span>
          <h1 className="text-xl font-black text-white mt-1 mb-2">لم تسجل الدخول بعد</h1>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
            سجل حسابك الآن لحفظ تمارينك وسجلات أوزانك بشكل آمن ومزامنتها على السحابة.
          </p>

          <button onClick={onLogin} className="app-primary-button cursor-pointer">
            <LogIn size={18} />
            <span>تسجيل الدخول أو إنشاء حساب جديد</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-content account-screen animate-fade-in pb-8">
      
      {/* Profile Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-[#10192e] to-[#0a0f1d] border border-white/10 shadow-2xl backdrop-blur-md mb-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#00ff88]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Avatar with Upload button */}
        <div className="relative w-24 h-24 mx-auto mb-3">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#00ff88]/20 to-[#00f0ff]/20 border-2 border-[#00ff88]/40 flex items-center justify-center text-3xl font-black text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.3)]">
            {account.avatar ? (
              <img src={account.avatar} alt="صورتك الشخصية" className="w-full h-full object-cover" />
            ) : (
              <span>{account.name.slice(0, 1).toUpperCase() || "G"}</span>
            )}
          </div>

          <label
            htmlFor="account-avatar"
            className="absolute -bottom-1 -left-1 w-8 h-8 rounded-xl bg-[#00ff88] text-black flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform"
            title="تغيير الصورة الشخصية"
          >
            <Camera size={15} />
          </label>
          <input id="account-avatar" className="hidden" type="file" accept="image/*" onChange={uploadAvatar} />
        </div>

        <h1 className="text-xl font-black text-white m-0">{account.name}</h1>
        <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 text-[#00ff88] text-[11px] font-bold">
          <ShieldCheck size={13} />
          <span>حساب رياضي نشط</span>
        </div>

        {/* Account Details Pills */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
            <span className="text-[10px] text-gray-400 block">العمر</span>
            <strong className="text-sm font-bold text-white">{account.age ? `${account.age} سنة` : "غير محدد"}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
            <span className="text-[10px] text-gray-400 block">حالة المزامنة</span>
            <strong className="text-sm font-bold text-[#00ff88]">سحابي ومحلي</strong>
          </div>
        </div>
      </div>

      {/* Weekly Progress Card */}
      <div className="p-4 rounded-2xl bg-[#0e1628]/85 border border-white/5 mb-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <Activity size={15} className="text-[#00ff88]" />
            <span>إنجاز الأسبوع التدريبي</span>
          </span>
          <strong className="text-sm font-black text-[#00ff88]">{weeklyProgress}%</strong>
        </div>

        <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/5 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00ff88] to-[#00f0ff] transition-all duration-500 shadow-[0_0_12px_rgba(0,255,136,0.5)]"
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>

        <span className="text-[10px] text-gray-400 block mt-2">
          يتم احتساب النسبة بناءً على الجلسات المكتملة في جدولك التدريبي.
        </span>
      </div>

      {/* App Stats & Badges */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3.5 rounded-2xl bg-[#0e1628]/80 border border-white/5 flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Flame size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-gray-400">الاستمرارية</span>
            <strong className="text-xs font-black text-white">3 أسابيع</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1628]/80 border border-white/5 flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00f0ff] shrink-0">
            <Award size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-gray-400">المستوى</span>
            <strong className="text-xs font-black text-[#00f0ff]">PRO ATHLETE</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
