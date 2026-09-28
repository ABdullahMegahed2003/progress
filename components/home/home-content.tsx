"use client";

import { useEffect, useState } from "react";
import { Activity, Award, CalendarDays, ChevronLeft, ClipboardList, Dumbbell, Flame, Medal, ShieldCheck, Sparkles, TrendingUp, Trophy, User, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Screen } from "@/components/home/home-data";
import { calculateMetrics, compareMetrics, type WorkoutDay } from "@/lib/progress-calculator";

type LeaderUser = {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  commitment: number;
  volume: number;
  badge: string;
  isCurrentUser?: boolean;
};

function weekStart(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 1) % 7) + offset * 7);
  return date;
}

function keyFor(system: string, offset: number) {
  const date = weekStart(offset);
  const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  return `gym-workout-${system}-${key}`;
}

function readWeek(system: string, offset: number): WorkoutDay[] {
  const raw = localStorage.getItem(keyFor(system, offset));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WorkoutDay[];
  } catch {
    return [];
  }
}

export function HomeContent({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const router = useRouter();
  const [activeSystem, setActiveSystem] = useState("");
  const [streak, setStreak] = useState(0);

  // Dynamic user progress states calculated strictly from real data
  const [userCommitment, setUserCommitment] = useState(0);
  const [userOverloadPercent, setUserOverloadPercent] = useState(0);
  const [userVolume, setUserVolume] = useState(0);
  const [userName, setUserName] = useState("المتدرب");
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    const loadData = window.setTimeout(() => {
      const savedSystem = localStorage.getItem("gym-active-system") ?? localStorage.getItem("gym-system-saved") ?? "";
      setActiveSystem(savedSystem);

      // Load user profile
      const rawProfile = localStorage.getItem("gym-user-profile");
      if (rawProfile) {
        try {
          const prof = JSON.parse(rawProfile);
          if (prof.name) setUserName(prof.name);
          if (prof.avatar) setUserAvatar(prof.avatar);
        } catch {}
      }

      // Calculate Real Metrics
      const currentWeekDays = readWeek(savedSystem, 0);
      const previousWeekDays = readWeek(savedSystem, -1);

      const cMetrics = calculateMetrics(currentWeekDays);
      const pMetrics = calculateMetrics(previousWeekDays);
      const comparison = compareMetrics(cMetrics, pMetrics);

      setUserVolume(cMetrics.volume);
      setUserOverloadPercent(comparison.volumeChangePercent);

      // Real commitment percentage (% مجموعات مكتملة من إجمالي المجموعات)
      const allSets = currentWeekDays.flatMap((d) => (d.status === "rest" ? [] : d.exercises?.flatMap((e) => (e.skipped ? [] : e.sets)) ?? []));
      const doneSets = allSets.filter((s) => s.done);
      const commitment = allSets.length > 0 ? Math.round((doneSets.length / allSets.length) * 100) : cMetrics.totalSets > 0 ? 100 : 0;
      setUserCommitment(commitment);

      // Streak count (عدد الأيام النشطة المسجلة)
      setStreak(cMetrics.activeDaysCount || 0);
    }, 0);

    return () => window.clearTimeout(loadData);
  }, []);

  function openWorkoutDashboard() {
    if (activeSystem) {
      router.push(`/training-plan?system=${encodeURIComponent(activeSystem)}&mode=log`);
    } else {
      onNavigate("plans");
    }
  }

  // Dynamic Leaderboard list incorporating the current user's real metrics
  const leaderBoard: LeaderUser[] = [
    {
      id: "leader-1",
      name: "كابتن زياد المصري",
      rank: 1,
      commitment: 100,
      volume: Math.max(5200, userVolume + 800),
      badge: "وحش الأسبوع 🥇",
    },
    {
      id: "current-user",
      name: `${userName} (أنت)`,
      avatar: userAvatar,
      rank: userCommitment >= 80 ? 2 : 3,
      commitment: userCommitment,
      volume: userVolume,
      badge: userOverloadPercent > 0 ? `+${userOverloadPercent}% نمو 🚀` : "قيد التطور 💪",
      isCurrentUser: true,
    },
    {
      id: "leader-2",
      name: "عمر الحديدي",
      rank: userCommitment >= 80 ? 3 : 2,
      commitment: 88,
      volume: 3850,
      badge: "التزام أسبوعي ⚡",
    },
    {
      id: "leader-3",
      name: "محمود فيتنس",
      rank: 4,
      commitment: 75,
      volume: 2900,
      badge: "مستمر بثبات 🎯",
    },
  ].sort((a, b) => b.commitment - a.commitment || b.volume - a.volume).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div className="screen-content home-screen-content animate-fade-in pb-12">
      
      {/* High-Energy Header Greeting */}
      <div className="screen-greeting">
        <div>
          <span className="screen-kicker">جاهز للتدريب اليوم، يا {userName}؟</span>
          <h1>
            اكسر أرقامك.<br />
            <em>اتبع نموك العضلي الحقيقي.</em>
          </h1>
        </div>
        
        {/* Streak Badge */}
        <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-amber-500/20 to-rose-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-[11px] font-extrabold text-amber-300 mt-0.5">{streak} أيام نشطة</span>
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

      {/* ========================================================================= */}
      {/* Dynamic Performance & Growth Cards (محسوبة ديناميكياً من بيانات المستخدم الحقيقية) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        
        {/* Commitment Rate Card */}
        <div className="p-3.5 rounded-2xl bg-[#0e1526]/85 border border-white/5 flex items-center gap-3 backdrop-blur-md shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00f0ff] shrink-0">
            <Trophy size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-gray-400">
              {userCommitment >= 90 ? "أعلى أداء" : userCommitment >= 50 ? "أداء متصاعد" : "مستوى الالتزام"}
            </span>
            <strong className="text-sm font-extrabold text-white">
              {userCommitment}% ملتزم
            </strong>
          </div>
        </div>

        {/* Real Muscle Growth & Overload Card */}
        <div className="p-3.5 rounded-2xl bg-[#0e1526]/85 border border-white/5 flex items-center gap-3 backdrop-blur-md shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00ff88] shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-gray-400">النمو العضلي</span>
            <strong className="text-sm font-extrabold text-[#00ff88]">
              {userOverloadPercent >= 0 ? `+${userOverloadPercent}%` : `${userOverloadPercent}%`} زيادة
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏆 LEADERBOARD: تصدر القائمة ولوحة شرف المتدربين والتحفيز */}
      {/* ========================================================================= */}
      <section className="p-4 rounded-3xl bg-[#0e1628]/95 border border-[#00ff88]/30 shadow-2xl backdrop-blur-md mb-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00ff88]/20 text-[#00ff88] flex items-center justify-center font-bold">
              <Medal size={16} />
            </div>
            <div>
              <strong className="text-sm font-black text-white block">لوحة المتصدرين وتصنيف الأبطال 🏆</strong>
              <span className="text-[10px] text-gray-400">ترتيب المتدربين حسب الالتزام والحمل التدريبي</span>
            </div>
          </div>

          <span className="text-[11px] font-black text-[#00f0ff] px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
            أسبوعي
          </span>
        </div>

        {/* Leaderboard Ranked List */}
        <div className="space-y-2">
          {leaderBoard.map((trainee) => {
            const isFirst = trainee.rank === 1;
            const isSecond = trainee.rank === 2;
            const isThird = trainee.rank === 3;

            return (
              <div
                key={trainee.id}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                  trainee.isCurrentUser
                    ? "bg-[#00ff88]/10 border-2 border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.15)]"
                    : "bg-black/40 border border-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Rank Badge */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isFirst
                        ? "bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        : isSecond
                        ? "bg-slate-300 text-black"
                        : isThird
                        ? "bg-amber-700 text-white"
                        : "bg-white/5 text-gray-400 border border-white/10"
                    }`}
                  >
                    {trainee.rank}
                  </div>

                  {/* Avatar / Icon */}
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 text-xs font-bold">
                    {trainee.avatar ? (
                      <img src={trainee.avatar} alt={trainee.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{trainee.name.slice(0, 1)}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className={`text-xs font-black ${trainee.isCurrentUser ? "text-[#00ff88]" : "text-white"}`}>
                        {trainee.name}
                      </strong>
                      {trainee.isCurrentUser && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#00ff88] text-black">
                          أنت
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {trainee.volume > 0 ? `${trainee.volume.toLocaleString("ar-EG")} كجم حمل` : "لم يسجل بعد"} • {trainee.badge}
                    </span>
                  </div>
                </div>

                {/* Trainee Commitment Rate */}
                <div className="text-left shrink-0">
                  <span className="text-xs font-black text-white">{trainee.commitment}%</span>
                  <span className="text-[9px] text-[#00ff88] block">التزام</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily Log Tracker Banner */}
      <button className="daily-log-card cursor-pointer mb-4" onClick={() => router.push("/daily-log")}>
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
      <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-white/5">
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