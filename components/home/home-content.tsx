"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarDays, ChevronLeft, ClipboardList, Dumbbell, Flame, Sparkles, Trophy, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Screen } from "@/components/home/home-data";

export function HomeContent({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const router = useRouter();
  const [activeSystem, setActiveSystem] = useState("");
  const [streak, setStreak] = useState(3);

  useEffect(() => {
    const loadSystem = window.setTimeout(() => {
      const saved = localStorage.getItem("gym-active-system") ?? localStorage.getItem("gym-system-saved") ?? "";
      setActiveSystem(saved);
    }, 0);
    return () => window.clearTimeout(loadSystem);
  }, []);

  function openWorkoutDashboard() {
    if (activeSystem) {
      router.push(`/training-plan?system=${encodeURIComponent(activeSystem)}&mode=log`);
    } else {
      onNavigate("plans");
    }
  }

  return (
    <div className="screen-content home-screen-content animate-fade-in">
      
      {/* High-Energy Header Greeting */}
      <div className="screen-greeting">
        <div>
          <span className="screen-kicker">جاهز للتدريب اليوم؟</span>
          <h1>
            اكسر أرقامك.<br />
            <em>اتبع نموك العضلي.</em>
          </h1>
        </div>
        
        {/* Streak Badge */}
        <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-amber-500/20 to-rose-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-[11px] font-extrabold text-amber-300 mt-0.5">{streak} أيام</span>
        </div>
      </div>

      {/* Main Today's Workout Neon Card */}
      <div className="today-card dashboard-card">
        <div className="today-card-top">
          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
            <Activity size={15} className="text-[#00ff88]" />
            <span>لوحة التدريب اليومية</span>
          </span>
          <b>{activeSystem || "اختر نظامك"}</b>
        </div>

        <div className="today-main">
          <div className="today-icon">
            <Dumbbell size={28} />
          </div>
          <div>
            <h2>{activeSystem ? "جدول تمارينك المجهز" : "ابدأ نظامك التدريبي"}</h2>
            <p>
              {activeSystem
                ? "سجل الجلسات والأوزان والعدات بنقرة واحدة."
                : "اختر جدول Push Pull Legs أو Arnold Split وابدأ فوراً."}
            </p>
          </div>
        </div>

        <button className="app-primary-button cursor-pointer" onClick={openWorkoutDashboard}>
          <span>{activeSystem ? "فتح لوحة التمرين والتسجيل" : "اختيار الجدول التدريبي"}</span>
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3.5 rounded-2xl bg-[#0e1526]/80 border border-white/5 flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00f0ff] shrink-0">
            <Trophy size={18} />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-gray-400">أعلى أداء</span>
            <strong className="text-sm font-extrabold text-white">100% ملتزم</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1526]/80 border border-white/5 flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00ff88] shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-gray-400">النمو العضلي</span>
            <strong className="text-sm font-extrabold text-[#00ff88]">+15% زيادة</strong>
          </div>
        </div>
      </div>

      {/* Daily Log Tracker Banner */}
      <button className="daily-log-card cursor-pointer" onClick={() => router.push("/daily-log")}>
        <span className="daily-log-icon">
          <ClipboardList size={22} />
        </span>
        <span className="flex-1">
          <strong>سجل اليوم الذكي</strong>
          <small>تتبع ساعات النوم، الوجبات، ومستوى طاقتك في الجيم</small>
        </span>
        <ChevronLeft size={18} className="text-cyan-400" />
      </button>

      {/* Quick Action Systems Switcher */}
      <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-white/5 mt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span>الأنظمة التدريبية المتوفرة</span>
          </span>
          <button
            onClick={() => onNavigate("plans")}
            className="text-[11px] font-bold text-[#00ff88] hover:underline cursor-pointer"
          >
            عرض الكل
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["Push Pull Legs", "Arnold Split", "Upper / Lower"].map((sys) => (
            <button
              key={sys}
              onClick={() => {
                localStorage.setItem("gym-active-system", sys);
                localStorage.setItem("gym-system-saved", sys);
                router.push(`/training-plan?system=${encodeURIComponent(sys)}`);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-[#00ff88]/15 border border-white/5 hover:border-[#00ff88]/40 text-center transition-all cursor-pointer group"
            >
              <span className="block text-[11px] font-bold text-gray-200 group-hover:text-[#00ff88] truncate">
                {sys}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}