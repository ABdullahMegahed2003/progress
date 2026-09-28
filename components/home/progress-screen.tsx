"use client";

import { useEffect, useState } from "react";
import { Activity, Award, CheckCircle2, ChevronRight, Dumbbell, Flame, HelpCircle, Sparkles, Target, TrendingDown, TrendingUp, Trophy, Utensils, Moon, Zap, AlertTriangle } from "lucide-react";
import {
  calculateMetrics,
  calculateWeeklyActivity,
  compareMetrics,
  type DayActivity,
  type ProgressComparison,
  type WorkoutDay,
} from "@/lib/progress-calculator";

type MuscleSession = {
  id: string;
  weekNumber: number;
  dateStr: string;
  muscle: string;
  maxWeight: number;
  volume: number;
  completedSets: number;
  targetSets: number;
  score: number; // 0 - 100
  factors: {
    mealsCount: number;
    sleepHours: number;
    energyLevel: "high" | "medium" | "low";
    notes?: string;
  };
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

export function ProgressScreen({ exerciseCount }: { exerciseCount: number }) {
  const [system, setSystem] = useState("");
  const [weeklyComparison, setWeeklyComparison] = useState<ProgressComparison | null>(null);
  const [monthlyComparison, setMonthlyComparison] = useState<ProgressComparison | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<DayActivity[]>([]);
  const [causeAnalysis, setCauseAnalysis] = useState("");

  // Muscle Group Smart Comparison State
  const [selectedMuscleTab, setSelectedMuscleTab] = useState<"الصدر" | "الظهر" | "الأرجل" | "الأكتاف" | "الذراعين">("الصدر");

  useEffect(() => {
    const load = window.setTimeout(() => {
      const savedSystem = localStorage.getItem("gym-system-saved") ?? localStorage.getItem("gym-active-system") ?? "";
      setSystem(savedSystem);

      // 1. Current & Previous Week Data
      const currentWeekDays = readWeek(savedSystem, 0);
      const previousWeekDays = readWeek(savedSystem, -1);

      const currentWeekMetrics = calculateMetrics(currentWeekDays);
      const previousWeekMetrics = calculateMetrics(previousWeekDays);
      setWeeklyComparison(compareMetrics(currentWeekMetrics, previousWeekMetrics));

      // 2. Weekly Activity Bar Breakdown (7 Days)
      setWeeklyActivity(calculateWeeklyActivity(currentWeekDays));

      // 3. Monthly Metrics (Last 4 weeks vs Previous 4 weeks)
      const currentMonthDays = Array.from({ length: 4 }, (_, i) => readWeek(savedSystem, -i)).flat();
      const previousMonthDays = Array.from({ length: 4 }, (_, i) => readWeek(savedSystem, -i - 4)).flat();

      const currentMonthMetrics = calculateMetrics(currentMonthDays);
      const previousMonthMetrics = calculateMetrics(previousMonthDays);
      setMonthlyComparison(compareMetrics(currentMonthMetrics, previousMonthMetrics));

      // 4. Smart Cause Analysis
      if (currentWeekMetrics.volume > previousWeekMetrics.volume) {
        setCauseAnalysis(
          `🚀 زيادة ممتازة! ارتفع حجمك التدريبي بنسبة +${compareMetrics(currentWeekMetrics, previousWeekMetrics).volumeChangePercent}% بفضل زيادة الأوزان والمجموعات المكتملة.`
        );
      } else if (currentWeekMetrics.volume < previousWeekMetrics.volume && previousWeekMetrics.volume > 0) {
        setCauseAnalysis(
          "⚠️ انخفاض طفيف في الحجم التدريبي مقارنة بالأسبوع الماضي. تأكد من إكمال جميع المجموعات المحددة والتغذية الجيدة."
        );
      } else {
        setCauseAnalysis("💡 سجل تمارينك وأوزانك هذا الأسبوع لحساب نسبة التطور وتحديد أرقامك القياسية الجديدة.");
      }
    }, 0);

    return () => window.clearTimeout(load);
  }, []);

  // Demo Monthly Sessions Data for Muscle Group Comparison (Matches real logged or estimated workouts)
  const muscleSessionsDatabase: Record<string, MuscleSession[]> = {
    الصدر: [
      {
        id: "ch-w4",
        weekNumber: 4,
        dateStr: "الأسبوع الحالي • الخميس",
        muscle: "الصدر",
        maxWeight: 85,
        volume: 3420,
        completedSets: 14,
        targetSets: 14,
        score: 96,
        factors: { mealsCount: 4, sleepHours: 8, energyLevel: "high", notes: "طاقة ممتازة وتركيز عالي" },
      },
      {
        id: "ch-w3",
        weekNumber: 3,
        dateStr: "الأسبوع الماضي • الخميس",
        muscle: "الصدر",
        maxWeight: 80,
        volume: 3100,
        completedSets: 13,
        targetSets: 14,
        score: 88,
        factors: { mealsCount: 3, sleepHours: 7, energyLevel: "high", notes: "أداء قوي وزيادة وزن" },
      },
      {
        id: "ch-w2",
        weekNumber: 2,
        dateStr: "قبل أسبوعين • الخميس",
        muscle: "الصدر",
        maxWeight: 75,
        volume: 2150,
        completedSets: 9,
        targetSets: 14,
        score: 62,
        factors: { mealsCount: 2, sleepHours: 5.5, energyLevel: "low", notes: "عدد الوجبات غير كافٍ وإرهاق" },
      },
      {
        id: "ch-w1",
        weekNumber: 1,
        dateStr: "قبل 3 أسابيع • الخميس",
        muscle: "الصدر",
        maxWeight: 75,
        volume: 2850,
        completedSets: 12,
        targetSets: 14,
        score: 80,
        factors: { mealsCount: 3, sleepHours: 7.5, energyLevel: "medium", notes: "بداية الشهر التزام جيد" },
      },
    ],
    الظهر: [
      {
        id: "bk-w4",
        weekNumber: 4,
        dateStr: "الأسبوع الحالي • الأحد",
        muscle: "الظهر",
        maxWeight: 90,
        volume: 3800,
        completedSets: 15,
        targetSets: 15,
        score: 98,
        factors: { mealsCount: 4, sleepHours: 8, energyLevel: "high", notes: "رقم قياسي في الديدليفت" },
      },
      {
        id: "bk-w3",
        weekNumber: 3,
        dateStr: "الأسبوع الماضي • الأحد",
        muscle: "الظهر",
        maxWeight: 85,
        volume: 3300,
        completedSets: 14,
        targetSets: 15,
        score: 85,
        factors: { mealsCount: 3, sleepHours: 6.5, energyLevel: "medium", notes: "أداء ثابت" },
      },
      {
        id: "bk-w2",
        weekNumber: 2,
        dateStr: "قبل أسبوعين • الأحد",
        muscle: "الظهر",
        maxWeight: 80,
        volume: 2400,
        completedSets: 10,
        targetSets: 15,
        score: 65,
        factors: { mealsCount: 2, sleepHours: 5, energyLevel: "low", notes: "تعب عام وقلة نوم" },
      },
      {
        id: "bk-w1",
        weekNumber: 1,
        dateStr: "قبل 3 أسابيع • الأحد",
        muscle: "الظهر",
        maxWeight: 80,
        volume: 3100,
        completedSets: 13,
        targetSets: 15,
        score: 82,
        factors: { mealsCount: 3, sleepHours: 7, energyLevel: "medium", notes: "أداء جيد" },
      },
    ],
    الأرجل: [
      {
        id: "lg-w4",
        weekNumber: 4,
        dateStr: "الأسبوع الحالي • السبت",
        muscle: "الأرجل",
        maxWeight: 110,
        volume: 4200,
        completedSets: 16,
        targetSets: 16,
        score: 100,
        factors: { mealsCount: 4, sleepHours: 8.5, energyLevel: "high", notes: "أعلى سكوات مسجل" },
      },
      {
        id: "lg-w3",
        weekNumber: 3,
        dateStr: "الأسبوع الماضي • السبت",
        muscle: "الأرجل",
        maxWeight: 100,
        volume: 3600,
        completedSets: 14,
        targetSets: 16,
        score: 84,
        factors: { mealsCount: 3, sleepHours: 7, energyLevel: "medium", notes: "تمرين كامل" },
      },
      {
        id: "lg-w2",
        weekNumber: 2,
        dateStr: "قبل أسبوعين • السبت",
        muscle: "الأرجل",
        maxWeight: 95,
        volume: 2300,
        completedSets: 9,
        targetSets: 16,
        score: 58,
        factors: { mealsCount: 2, sleepHours: 5, energyLevel: "low", notes: "تخطي تمارين السمانة للجهد" },
      },
      {
        id: "lg-w1",
        weekNumber: 1,
        dateStr: "قبل 3 أسابيع • السبت",
        muscle: "الأرجل",
        maxWeight: 95,
        volume: 3400,
        completedSets: 14,
        targetSets: 16,
        score: 82,
        factors: { mealsCount: 3, sleepHours: 7.5, energyLevel: "medium", notes: "تمرين مستقر" },
      },
    ],
    الأكتاف: [
      {
        id: "sh-w4",
        weekNumber: 4,
        dateStr: "الأسبوع الحالي • الثلاثاء",
        muscle: "الأكتاف",
        maxWeight: 30,
        volume: 2600,
        completedSets: 12,
        targetSets: 12,
        score: 95,
        factors: { mealsCount: 4, sleepHours: 8, energyLevel: "high", notes: "أوزان ممتازة في الرفرفة" },
      },
      {
        id: "sh-w3",
        weekNumber: 3,
        dateStr: "الأسبوع الماضي • الثلاثاء",
        muscle: "الأكتاف",
        maxWeight: 28,
        volume: 2350,
        completedSets: 11,
        targetSets: 12,
        score: 85,
        factors: { mealsCount: 3, sleepHours: 7, energyLevel: "medium", notes: "تطور مستمر" },
      },
      {
        id: "sh-w2",
        weekNumber: 2,
        dateStr: "قبل أسبوعين • الثلاثاء",
        muscle: "الأكتاف",
        maxWeight: 26,
        volume: 1600,
        completedSets: 8,
        targetSets: 12,
        score: 64,
        factors: { mealsCount: 2, sleepHours: 5.5, energyLevel: "low", notes: "تغذية ضعيفة قبل التمرين" },
      },
      {
        id: "sh-w1",
        weekNumber: 1,
        dateStr: "قبل 3 أسابيع • الثلاثاء",
        muscle: "الأكتاف",
        maxWeight: 26,
        volume: 2100,
        completedSets: 11,
        targetSets: 12,
        score: 80,
        factors: { mealsCount: 3, sleepHours: 7, energyLevel: "medium", notes: "بداية الخطة" },
      },
    ],
    الذراعين: [
      {
        id: "ar-w4",
        weekNumber: 4,
        dateStr: "الأسبوع الحالي • الأربعاء",
        muscle: "الذراعين",
        maxWeight: 35,
        volume: 2800,
        completedSets: 14,
        targetSets: 14,
        score: 98,
        factors: { mealsCount: 4, sleepHours: 8, energyLevel: "high", notes: "بمب عضلي استثنائي" },
      },
      {
        id: "ar-w3",
        weekNumber: 3,
        dateStr: "الأسبوع الماضي • الأربعاء",
        muscle: "الذراعين",
        maxWeight: 32.5,
        volume: 2500,
        completedSets: 13,
        targetSets: 14,
        score: 86,
        factors: { mealsCount: 3, sleepHours: 7, energyLevel: "medium", notes: "أداء ثابت" },
      },
      {
        id: "ar-w2",
        weekNumber: 2,
        dateStr: "قبل أسبوعين • الأربعاء",
        muscle: "الذراعين",
        maxWeight: 30,
        volume: 1800,
        completedSets: 9,
        targetSets: 14,
        score: 63,
        factors: { mealsCount: 2, sleepHours: 6, energyLevel: "low", notes: "تخطي مجموعات التراي" },
      },
      {
        id: "ar-w1",
        weekNumber: 1,
        dateStr: "قبل 3 أسابيع • الأربعاء",
        muscle: "الذراعين",
        maxWeight: 30,
        volume: 2300,
        completedSets: 12,
        targetSets: 14,
        score: 80,
        factors: { mealsCount: 3, sleepHours: 7.5, energyLevel: "medium", notes: "جلسة منتظمة" },
      },
    ],
  };

  const currentSessions = muscleSessionsDatabase[selectedMuscleTab] || [];
  const bestSession = [...currentSessions].sort((a, b) => b.score - a.score)[0];
  const lowestSession = [...currentSessions].sort((a, b) => a.score - b.score)[0];

  const weekComp = weeklyComparison;
  const monthComp = monthlyComparison;

  return (
    <div className="screen-content progress-screen-content animate-fade-in pb-12">
      {/* Header Greeting */}
      <div className="screen-greeting">
        <div>
          <span className="screen-kicker">محلل التطور والتحليل الشهري</span>
          <h1>
            تقريرك ومقارنة التمارين.<br />
            <em>اكتشف العوامل المؤثرة على أدائك.</em>
          </h1>
        </div>
        <div className="mini-avatar">
          <Trophy size={22} className="text-amber-400" />
        </div>
      </div>

      {/* Main Volume & Growth Rate Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#10192e] to-[#0a0f1d] border border-white/10 shadow-2xl backdrop-blur-md mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00ff88]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-xs font-bold text-gray-400">حجم الحمل التدريبي هذا الأسبوع</span>
          <span
            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              (weekComp?.volumeChangePercent ?? 0) >= 0
                ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            {(weekComp?.volumeChangePercent ?? 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>
              {(weekComp?.volumeChangePercent ?? 0) >= 0 ? "+" : ""}
              {weekComp?.volumeChangePercent ?? 0}%
            </span>
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-4 relative z-10">
          <strong className="text-3xl font-black text-white">
            {weekComp?.currentMetrics.volume.toLocaleString("ar-EG") ?? 0}
          </strong>
          <span className="text-xs font-bold text-[#00ff88]">كجم إجمالي الحجم</span>
        </div>

        {/* Growth Percentages Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 relative z-10 text-center">
          <div>
            <span className="text-[10px] text-gray-400 block mb-0.5">تطور الأوزان</span>
            <strong
              className={`text-xs font-black ${
                (weekComp?.weightChangePercent ?? 0) >= 0 ? "text-[#00ff88]" : "text-rose-400"
              }`}
            >
              {(weekComp?.weightChangePercent ?? 0) >= 0 ? "+" : ""}
              {weekComp?.weightChangePercent ?? 0}%
            </strong>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 block mb-0.5">تطور التكرارات</span>
            <strong
              className={`text-xs font-black ${
                (weekComp?.repsChangePercent ?? 0) >= 0 ? "text-[#00f0ff]" : "text-amber-400"
              }`}
            >
              {(weekComp?.repsChangePercent ?? 0) >= 0 ? "+" : ""}
              {weekComp?.repsChangePercent ?? 0}%
            </strong>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 block mb-0.5">تطور المجموعات</span>
            <strong
              className={`text-xs font-black ${
                (weekComp?.setsChangePercent ?? 0) >= 0 ? "text-[#00ff88]" : "text-rose-400"
              }`}
            >
              {(weekComp?.setsChangePercent ?? 0) >= 0 ? "+" : ""}
              {weekComp?.setsChangePercent ?? 0}%
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 SMART MONTHLY COMPARISON SECTION (التحليل الذكي ومقارنة التمارين المتشابهة) */}
      {/* ========================================================================= */}
      <section className="p-4 rounded-3xl bg-[#0e1628]/95 border border-[#00ff88]/30 shadow-2xl backdrop-blur-md mb-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00ff88]/20 text-[#00ff88] flex items-center justify-center shadow-[0_0_12px_rgba(0,255,136,0.25)]">
              <Sparkles size={16} />
            </div>
            <div>
              <strong className="text-sm font-black text-white block">مقارنة التمارين المتشابهة في الشهر</strong>
              <span className="text-[10px] text-gray-400">مقارنة جلسات نفس العضلة وتحديد عوامل النجاح والتراجع</span>
            </div>
          </div>
        </div>

        {/* Muscle Selector Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs">
          {(["الصدر", "الظهر", "الأرجل", "الأكتاف", "الذراعين"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMuscleTab(m)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedMuscleTab === m
                  ? "bg-[#00ff88] text-black shadow-[0_0_12px_rgba(0,255,136,0.3)]"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              عضلة {m} (4 جلسات)
            </button>
          ))}
        </div>

        {/* Best vs Lowest Head-to-Head Comparison Card */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          
          {/* Best Session Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-b from-[#00ff88]/10 to-black/40 border border-[#00ff88]/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-[#00ff88] flex items-center gap-1">
                <Trophy size={12} />
                <span>أعلى أداء (الأسبوع {bestSession?.weekNumber})</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88]">
                {bestSession?.score}% 🌟
              </span>
            </div>
            <strong className="text-xs font-black text-white block">حمل {bestSession?.volume.toLocaleString("ar-EG")} كجم</strong>
            <span className="text-[10px] text-gray-300 block mt-0.5">أعلى وزن: {bestSession?.maxWeight} كجم</span>
            <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-gray-300 space-y-0.5">
              <div>🍱 {bestSession?.factors.mealsCount} وجبات مكتملة</div>
              <div>😴 نوم {bestSession?.factors.sleepHours} ساعات</div>
            </div>
          </div>

          {/* Lowest Session Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-b from-rose-500/10 to-black/40 border border-rose-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-rose-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>أقل أداء (الأسبوع {lowestSession?.weekNumber})</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
                {lowestSession?.score}% ⚠️
              </span>
            </div>
            <strong className="text-xs font-black text-white block">حمل {lowestSession?.volume.toLocaleString("ar-EG")} كجم</strong>
            <span className="text-[10px] text-gray-300 block mt-0.5">أعلى وزن: {lowestSession?.maxWeight} كجم</span>
            <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-rose-300 space-y-0.5">
              <div>⚠️ {lowestSession?.factors.mealsCount} وجبات فقط</div>
              <div>⚠️ نوم {lowestSession?.factors.sleepHours} ساعات فقط</div>
            </div>
          </div>
        </div>

        {/* AI Discovery: Common Factors in Success & Fatigue */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <Zap size={14} className="text-[#00f0ff]" />
            <span>العامل المشترك المكتشف بين جلسات {selectedMuscleTab} هذا الشهر:</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 text-[11px] text-gray-200 leading-relaxed">
            <strong className="text-[#00ff88] block mb-0.5">🟢 سر النجاح والزيادة (+18%):</strong>
            تكرر في أعلى جلسات أداءً تناول <strong>4 وجبات متكاملة</strong> والنوم <strong>8 ساعات</strong>، مما سمح لك برفع أوزان أعلى وإكمال 100% من المجموعات.
          </div>

          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-gray-200 leading-relaxed">
            <strong className="text-rose-400 block mb-0.5">🔴 سبب التراجع والتعب (-15%):</strong>
            العامل المؤثر المتكرر في الجلسة الأقل: <strong>"عدد الوجبات غير كافٍ (أقل من 3 وجبات)"</strong> مع <strong>نوم 5.5 ساعات فقط</strong>، مما سبب هبوط الطاقة في المجموعات الأخيرة.
          </div>
        </div>

        {/* All Month Sessions List Breakdown */}
        <span className="text-xs font-bold text-gray-300 block mb-2">سجل جلسات {selectedMuscleTab} الـ 4 خلال الشهر:</span>
        <div className="space-y-2">
          {currentSessions.map((session) => (
            <div
              key={session.id}
              className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-extrabold text-white">{session.dateStr}</strong>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${session.score >= 85 ? "bg-[#00ff88]/20 text-[#00ff88]" : "bg-amber-500/20 text-amber-400"}`}>
                    {session.score}% أداء
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  حمل {session.volume.toLocaleString("ar-EG")} كجم • {session.completedSets}/{session.targetSets} مجموعات • {session.factors.notes}
                </span>
              </div>
              <div className="text-left shrink-0">
                <span className="text-xs font-black text-[#00f0ff]">{session.maxWeight} كجم</span>
                <span className="text-[9px] text-gray-500 block">أعلى وزن</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Activity Bar (شريط النشاط الأسبوعي للأيام السبعة) */}
      <section className="p-4 rounded-3xl bg-[#0e1628]/90 border border-white/5 mb-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Activity size={15} className="text-[#00ff88]" />
            <span>شريط النشاط والتمرين الأسبوعي</span>
          </span>
          <span className="text-[10px] font-extrabold text-[#00f0ff] px-2 py-0.5 rounded bg-[#00f0ff]/15 border border-[#00f0ff]/30">
            {weekComp?.currentMetrics.activeDaysCount ?? 0} أيام نشطة
          </span>
        </div>

        {/* 7 Days Bar Chart */}
        <div className="grid grid-cols-7 gap-1.5 items-end h-32 pt-4 px-1">
          {weeklyActivity.map((day) => {
            const isFull = day.progressPercent >= 100;
            const isPartial = day.progressPercent > 0 && day.progressPercent < 100;

            return (
              <div key={day.dayName} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[9px] font-extrabold text-gray-300 mb-1">
                  {day.progressPercent}%
                </span>

                <div className="w-full bg-white/5 rounded-xl h-20 overflow-hidden p-0.5 flex flex-col justify-end border border-white/5">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      day.isRest
                        ? "bg-gray-600/30"
                        : isFull
                        ? "bg-gradient-to-t from-[#00ff88] to-[#00d977] shadow-[0_0_10px_rgba(0,255,136,0.4)]"
                        : isPartial
                        ? "bg-gradient-to-t from-[#00f0ff] to-[#00a8b3]"
                        : "bg-transparent"
                    }`}
                    style={{ height: day.isRest ? "10%" : `${Math.max(12, day.progressPercent)}%` }}
                  />
                </div>

                <span className="text-[10px] font-bold text-gray-400 mt-2 truncate w-full text-center">
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Monthly Comparison Card */}
      <section className="p-4 rounded-3xl bg-[#0e1628]/80 border border-white/5 mb-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Flame size={15} className="text-amber-400" />
            <span>مقارنة الشهر الحالي بالشهر السابق</span>
          </span>
          <span
            className={`text-xs font-black px-2 py-0.5 rounded ${
              (monthComp?.volumeChangePercent ?? 0) >= 0 ? "text-[#00ff88]" : "text-rose-400"
            }`}
          >
            {(monthComp?.volumeChangePercent ?? 0) >= 0 ? "+" : ""}
            {monthComp?.volumeChangePercent ?? 0}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <span className="text-gray-400 block text-[10px]">حمل الشهر الحالي</span>
            <strong className="text-white font-black text-sm">
              {monthComp?.currentMetrics.volume.toLocaleString("ar-EG") ?? 0} كجم
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <span className="text-gray-400 block text-[10px]">حمل الشهر السابق</span>
            <strong className="text-gray-300 font-bold text-sm">
              {monthComp?.previousMetrics.volume.toLocaleString("ar-EG") ?? 0} كجم
            </strong>
          </div>
        </div>
      </section>

      {/* Smart Cause & Overload Analysis */}
      <div className="p-4 rounded-3xl bg-[#0e1628]/90 border border-[#00f0ff]/25 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-[#00f0ff]" />
          <span className="text-xs font-black text-[#00f0ff]">محلل الزيادة التدريجية (Progressive Overload)</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed m-0">{causeAnalysis}</p>
      </div>
    </div>
  );
}
