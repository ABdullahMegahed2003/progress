"use client";

import { useEffect, useState } from "react";
import { Activity, Dumbbell, Flame, Sparkles, Target, TrendingDown, TrendingUp, Trophy, Zap } from "lucide-react";
import {
  calculateMetrics,
  calculateWeeklyActivity,
  compareMetrics,
  type DayActivity,
  type ProgressComparison,
  type WorkoutDay,
} from "@/lib/progress-calculator";

type DailyFactorLog = {
  date: string;
  sleep: string;
  energy: string;
  effort: string;
  workoutTime: string;
  meals: Array<unknown>;
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

  const weekComp = weeklyComparison;
  const monthComp = monthlyComparison;

  return (
    <div className="screen-content progress-screen-content animate-fade-in pb-12">
      {/* Header Greeting */}
      <div className="screen-greeting">
        <div>
          <span className="screen-kicker">محلل التطور والزيادة التدريجية</span>
          <h1>
            تقريرك التدريبي.<br />
            <em>الأوزان والعدات والمجموعات.</em>
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

        {/* Growth Percentages Breakdown Grid (الأوزان • التكرارات • المجموعات) */}
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
