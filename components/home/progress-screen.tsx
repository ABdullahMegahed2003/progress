"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, Award, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, Flame, Moon, Sparkles, Target, TrendingDown, TrendingUp, Trophy, Utensils, Zap } from "lucide-react";
import Link from "next/link";
import {
  calculateMetrics,
  calculateWeeklyActivity,
  compareMetrics,
  type DayActivity,
  type ProgressComparison,
  type WorkoutDay,
} from "@/lib/progress-calculator";

type DailyFactors = {
  date: string;
  sleep?: string;
  energy?: string;
  effort?: string;
  workoutTime?: string;
  meals?: Array<{ id: string; name: string; time: string; details?: string }>;
  notes?: string;
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
  const [currentWeekDays, setCurrentWeekDays] = useState<WorkoutDay[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => (new Date().getDay() + 1) % 7);
  const [dayFactors, setDayFactors] = useState<DailyFactors | null>(null);
  const [causeAnalysis, setCauseAnalysis] = useState("");

  useEffect(() => {
    const load = window.setTimeout(() => {
      const savedSystem = localStorage.getItem("gym-system-saved") ?? localStorage.getItem("gym-active-system") ?? "";
      setSystem(savedSystem);

      // 1. Current & Previous Week Real Data
      const cWeek = readWeek(savedSystem, 0);
      const pWeek = readWeek(savedSystem, -1);
      setCurrentWeekDays(cWeek);

      const currentWeekMetrics = calculateMetrics(cWeek);
      const previousWeekMetrics = calculateMetrics(pWeek);
      setWeeklyComparison(compareMetrics(currentWeekMetrics, previousWeekMetrics));

      // 2. Weekly Activity Bar Breakdown (7 Days)
      setWeeklyActivity(calculateWeeklyActivity(cWeek));

      // 3. Monthly Metrics (Last 4 weeks vs Previous 4 weeks)
      const cMonth = Array.from({ length: 4 }, (_, i) => readWeek(savedSystem, -i)).flat();
      const pMonth = Array.from({ length: 4 }, (_, i) => readWeek(savedSystem, -i - 4)).flat();

      const currentMonthMetrics = calculateMetrics(cMonth);
      const previousMonthMetrics = calculateMetrics(pMonth);
      setMonthlyComparison(compareMetrics(currentMonthMetrics, previousMonthMetrics));

      // 4. Dynamic Cause & Progressive Overload Analysis
      const weekComp = compareMetrics(currentWeekMetrics, previousWeekMetrics);
      if (currentWeekMetrics.volume > 0 && previousWeekMetrics.volume > 0) {
        if (weekComp.volumeChangePercent > 0) {
          setCauseAnalysis(
            `🚀 تطور ممتاز! ارتفع حجمك التدريبي هذا الأسبوع بنسبة +${weekComp.volumeChangePercent}% (+${(currentWeekMetrics.volume - previousWeekMetrics.volume).toLocaleString("ar-EG")} كجم) بفضل زيادة الأوزان والتكرارات المكتملة.`
          );
        } else if (weekComp.volumeChangePercent < 0) {
          setCauseAnalysis(
            `⚠️ انخفاض في الحجم التدريبي بنسبة ${weekComp.volumeChangePercent}%. يرجع ذلك لتخطي بعض المجموعات أو رفع أوزان أقل من الأسبوع السابق.`
          );
        } else {
          setCauseAnalysis("⚖️ حجمك التدريبي مستقر مقارنة بالأسبوع الماضي. حاول زيادة وزن طفيف (1-2.5 كجم) في تمارينك الأساسية.");
        }
      } else if (currentWeekMetrics.volume > 0) {
        setCauseAnalysis(
          `💪 بداية رائعة! سجلت حجم تدريبي إجمالي قدره ${currentWeekMetrics.volume.toLocaleString("ar-EG")} كجم عبر ${currentWeekMetrics.totalSets} مجموعات مكتملة.`
        );
      } else {
        setCauseAnalysis("💡 لم تسجل تمارين بعد هذا الأسبوع. افتح صفحة (تمريناتي) وسجل أوزانك وعداتك لتظهر تحليلاتك فوراً هنا.");
      }
    }, 0);

    return () => window.clearTimeout(load);
  }, []);

  // Read actual factors for the currently inspected day
  const selectedDayData = currentWeekDays[selectedDayIndex];
  useEffect(() => {
    if (!selectedDayData?.date) {
      setDayFactors(null);
      return;
    }
    const rawFactors = localStorage.getItem(`gym-daily-${selectedDayData.date}`);
    if (rawFactors) {
      try {
        setDayFactors(JSON.parse(rawFactors) as DailyFactors);
      } catch {
        setDayFactors(null);
      }
    } else {
      setDayFactors(null);
    }
  }, [selectedDayData?.date]);

  // Calculate day-specific real metrics for best & lowest day comparison
  const dayPerformanceList = currentWeekDays.map((d, index) => {
    const dayMetrics = calculateMetrics([d]);
    const allSets = d.exercises?.flatMap((e) => (e.skipped ? [] : e.sets)) ?? [];
    const doneSets = allSets.filter((s) => s.done);
    const progress = allSets.length ? Math.round((doneSets.length / allSets.length) * 100) : 0;
    return {
      index,
      dayName: ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"][index] ?? `يوم ${index + 1}`,
      date: d.date,
      status: d.status,
      volume: dayMetrics.volume,
      maxWeight: dayMetrics.maxWeight,
      completedSets: doneSets.length,
      totalSets: allSets.length,
      progress,
      exercises: d.exercises ?? [],
    };
  });

  const activeDaysOnly = dayPerformanceList.filter((d) => d.status === "planned" && d.totalSets > 0);
  const bestDay = activeDaysOnly.length > 0 ? [...activeDaysOnly].sort((a, b) => b.volume - a.volume || b.progress - a.progress)[0] : null;
  const lowestDay = activeDaysOnly.length > 1 ? [...activeDaysOnly].sort((a, b) => a.volume - b.volume || a.progress - b.progress)[0] : null;

  const monthComp = monthlyComparison;
  const weekComp = weeklyComparison;

  // Selected Day Real Exercises & Logged Sets
  const selectedExercises = selectedDayData?.exercises ?? [];
  const selectedDoneSetsCount = selectedExercises.flatMap((e) => (e.skipped ? [] : e.sets)).filter((s) => s.done).length;
  const selectedTotalSetsCount = selectedExercises.flatMap((e) => (e.skipped ? [] : e.sets)).length;
  const selectedDayVolume = selectedExercises.reduce((total, ex) => {
    if (ex.skipped) return total;
    return total + ex.sets.filter((s) => s.done).reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
  }, 0);

  return (
    <div className="screen-content progress-screen-content animate-fade-in pb-12">
      
      {/* Header Greeting */}
      <div className="screen-greeting">
        <div>
          <span className="screen-kicker">محلل التطور الحقيقي (Progressive Overload)</span>
          <h1>
            تقرير تقدمك الفعلي.<br />
            <em>شهرياً • أسبوعياً • يومياً.</em>
          </h1>
        </div>
        <div className="mini-avatar">
          <Trophy size={22} className="text-amber-400" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. أولاً: نسبة الزيادة في الشهر (Monthly Overload Rate) */}
      {/* ========================================================================= */}
      <section className="p-5 rounded-3xl bg-gradient-to-br from-[#10192e] to-[#0a0f1d] border border-white/10 shadow-2xl backdrop-blur-md mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00ff88]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <span className="text-xs font-bold text-gray-400">1. نسبة الزيادة والتطور في الشهر</span>
          <span
            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              (monthComp?.volumeChangePercent ?? 0) >= 0
                ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            {(monthComp?.volumeChangePercent ?? 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>
              {(monthComp?.volumeChangePercent ?? 0) >= 0 ? "+" : ""}
              {monthComp?.volumeChangePercent ?? 0}% هذا الشهر
            </span>
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-4 relative z-10">
          <strong className="text-3xl font-black text-white">
            {monthComp?.currentMetrics.volume.toLocaleString("ar-EG") ?? 0}
          </strong>
          <span className="text-xs font-bold text-[#00ff88]">كجم حمل هذا الشهر</span>
          {Boolean(monthComp?.previousMetrics.volume) && (
            <span className="text-[11px] text-gray-400 mr-2">
              (مقابل {monthComp?.previousMetrics.volume.toLocaleString("ar-EG")} كجم الشهر السابق)
            </span>
          )}
        </div>

        {/* 4 Monthly Progressive Overload Indicators (أوزان • تكرارات • مجموعات • أيام) */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 relative z-10 text-center">
          <div>
            <span className="text-[10px] text-gray-400 block mb-0.5">تطور الأوزان</span>
            <strong
              className={`text-xs font-black ${
                (monthComp?.weightChangePercent ?? 0) >= 0 ? "text-[#00ff88]" : "text-rose-400"
              }`}
            >
              {(monthComp?.weightChangePercent ?? 0) >= 0 ? "+" : ""}
              {monthComp?.weightChangePercent ?? 0}%
            </strong>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 block mb-0.5">تطور التكرارات</span>
            <strong
              className={`text-xs font-black ${
                (monthComp?.repsChangePercent ?? 0) >= 0 ? "text-[#00f0ff]" : "text-amber-400"
              }`}
            >
              {(monthComp?.repsChangePercent ?? 0) >= 0 ? "+" : ""}
              {monthComp?.repsChangePercent ?? 0}%
            </strong>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 block mb-0.5">المجموعات المنجزة</span>
            <strong
              className={`text-xs font-black ${
                (monthComp?.setsChangePercent ?? 0) >= 0 ? "text-[#00ff88]" : "text-rose-400"
              }`}
            >
              {monthComp?.currentMetrics.totalSets ?? 0} مجموعة
            </strong>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ثانياً: نسبة الأسبوع الحالي وأعلى / أقل يوم أداءً */}
      {/* ========================================================================= */}
      <section className="p-4 rounded-3xl bg-[#0e1628]/90 border border-white/5 mb-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Activity size={16} className="text-[#00ff88]" />
            <strong className="text-xs font-bold text-white">2. نشاط الأسبوع الحالي ومقارنة الأيام</strong>
          </div>
          <span className="text-[10px] font-extrabold text-[#00f0ff] px-2 py-0.5 rounded bg-[#00f0ff]/15 border border-[#00f0ff]/30">
            {weekComp?.currentMetrics.volume.toLocaleString("ar-EG") ?? 0} كجم أسبوعي
          </span>
        </div>

        {/* 7 Days Bar Chart */}
        <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-2 px-1 mb-4">
          {weeklyActivity.map((day, idx) => {
            const isFull = day.progressPercent >= 100;
            const isPartial = day.progressPercent > 0 && day.progressPercent < 100;
            const isSelected = selectedDayIndex === idx;

            return (
              <button
                key={day.dayName}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center h-full justify-end group cursor-pointer transition-transform ${isSelected ? "scale-105" : ""}`}
              >
                <span className={`text-[9px] font-extrabold mb-1 ${isSelected ? "text-[#00ff88]" : "text-gray-400"}`}>
                  {day.progressPercent}%
                </span>

                <div className={`w-full rounded-xl h-16 overflow-hidden p-0.5 flex flex-col justify-end border transition-all ${isSelected ? "border-[#00ff88] bg-black/60 shadow-[0_0_10px_rgba(0,255,136,0.3)]" : "border-white/5 bg-white/5"}`}>
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      day.isRest
                        ? "bg-gray-600/30"
                        : isFull
                        ? "bg-gradient-to-t from-[#00ff88] to-[#00d977]"
                        : isPartial
                        ? "bg-gradient-to-t from-[#00f0ff] to-[#00a8b3]"
                        : "bg-transparent"
                    }`}
                    style={{ height: day.isRest ? "10%" : `${Math.max(12, day.progressPercent)}%` }}
                  />
                </div>

                <span className={`text-[10px] font-bold mt-1.5 truncate w-full text-center ${isSelected ? "text-white font-black" : "text-gray-400"}`}>
                  {day.dayName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Best Day vs Lowest Day Comparison Cards (Strictly Real Data) */}
        {bestDay && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            {/* Best Day Card */}
            <div className="p-3 rounded-2xl bg-gradient-to-b from-[#00ff88]/10 to-black/30 border border-[#00ff88]/30">
              <span className="text-[10px] font-black text-[#00ff88] flex items-center gap-1 mb-1">
                <Trophy size={12} />
                <span>أعلى يوم أداءً: {bestDay.dayName}</span>
              </span>
              <strong className="text-xs font-black text-white block">{bestDay.volume.toLocaleString("ar-EG")} كجم حمل</strong>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {bestDay.completedSets}/{bestDay.totalSets} مجموعات ({bestDay.progress}%)
              </span>
            </div>

            {/* Lowest Day Card */}
            {lowestDay ? (
              <div className="p-3 rounded-2xl bg-gradient-to-b from-rose-500/10 to-black/30 border border-rose-500/30">
                <span className="text-[10px] font-black text-rose-400 flex items-center gap-1 mb-1">
                  <AlertTriangle size={12} />
                  <span>أقل يوم أداءً: {lowestDay.dayName}</span>
                </span>
                <strong className="text-xs font-black text-white block">{lowestDay.volume.toLocaleString("ar-EG")} كجم حمل</strong>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {lowestDay.completedSets}/{lowestDay.totalSets} مجموعات ({lowestDay.progress}%)
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-center text-center text-[10px] text-gray-400">
                سجل باقي أيام الأسبوع لمقارنة أقل يوم أداءً
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. ثالثاً: تفاصيل يوم التمرين الفعلي والسجل المسجل */}
      {/* ========================================================================= */}
      <section className="p-4 rounded-3xl bg-[#0e1628]/95 border border-[#00f0ff]/30 shadow-2xl backdrop-blur-md mb-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-[#00f0ff] flex items-center justify-center font-bold">
              <Calendar size={16} />
            </div>
            <div>
              <strong className="text-sm font-black text-white block">
                3. تفاصيل تمرين {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"][selectedDayIndex]}
              </strong>
              <span className="text-[10px] text-gray-400">
                {selectedDayData?.date ? `تاريخ ${selectedDayData.date}` : "اليوم المختار"}
              </span>
            </div>
          </div>

          <Link
            href={`/training-plan?system=${encodeURIComponent(system)}&mode=log`}
            className="px-2.5 py-1 rounded-xl bg-[#00ff88] text-black font-extrabold text-xs flex items-center gap-1"
          >
            <span>تعديل في تمريناتي</span>
            <ChevronLeft size={14} />
          </Link>
        </div>

        {/* Day Summary Stats (Real Data) */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-black/40 border border-white/5 text-center mb-3">
          <div>
            <span className="text-[9px] text-gray-400 block">إنجاز اليوم</span>
            <strong className="text-xs font-black text-[#00ff88]">
              {selectedTotalSetsCount > 0 ? Math.round((selectedDoneSetsCount / selectedTotalSetsCount) * 100) : 0}%
            </strong>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 block">الحجم المرفوع</span>
            <strong className="text-xs font-black text-white">
              {selectedDayVolume.toLocaleString("ar-EG")} كجم
            </strong>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 block">المجموعات</span>
            <strong className="text-xs font-black text-[#00f0ff]">
              {selectedDoneSetsCount}/{selectedTotalSetsCount}
            </strong>
          </div>
        </div>

        {/* Contributing Factors for this Day (Meals, Sleep, Energy) if logged */}
        {dayFactors && (
          <div className="p-3 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 mb-3 text-xs space-y-1">
            <span className="text-[10px] font-black text-[#00ff88] block">العوامل اليومية المسجلة لهذا اليوم:</span>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-200">
              {dayFactors.meals && <span>🍱 {dayFactors.meals.length} وجبات مسجلة</span>}
              {dayFactors.sleep && <span>😴 نوم {dayFactors.sleep} ساعات</span>}
              {dayFactors.energy && <span>⚡ طاقة {dayFactors.energy}</span>}
              {dayFactors.effort && <span>🔥 مجهود {dayFactors.effort}</span>}
            </div>
            {dayFactors.notes && <p className="text-[10px] text-gray-300 mt-1">ملاحظاتك: {dayFactors.notes}</p>}
          </div>
        )}

        {/* List of Actual Logged Exercises for Selected Day */}
        {selectedExercises.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-black/30 border border-white/5 text-gray-400 text-xs">
            <Dumbbell size={24} className="mx-auto mb-2 text-gray-500" />
            <p className="m-0 font-bold text-gray-300">لا توجد تمارين مسجلة لهذا اليوم</p>
            <p className="text-[11px] text-gray-500 mt-1">
              افتح صفحة (تمريناتي) لتسجيل الأوزان والتكرارات لهذا اليوم.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedExercises.map((exercise, exIndex) => {
              const doneSets = exercise.sets?.filter((s) => s.done) ?? [];
              const maxExWeight = doneSets.reduce((max, s) => Math.max(max, Number(s.weight) || 0), 0);

              return (
                <div
                  key={exercise.id || exIndex}
                  className={`p-3 rounded-2xl border transition-all ${
                    exercise.skipped
                      ? "bg-rose-500/5 border-rose-500/20 opacity-60"
                      : doneSets.length > 0
                      ? "bg-black/50 border-white/10"
                      : "bg-black/30 border-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <strong className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-white/10 text-[10px] flex items-center justify-center text-gray-300">
                        {exIndex + 1}
                      </span>
                      <span>{exercise.name}</span>
                    </strong>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${doneSets.length === exercise.sets.length && doneSets.length > 0 ? "bg-[#00ff88]/20 text-[#00ff88]" : "bg-white/5 text-gray-400"}`}>
                      {exercise.skipped ? "تم التجاوز" : `${doneSets.length}/${exercise.sets.length} مجموعات`}
                    </span>
                  </div>

                  {/* Sets Breakdown List */}
                  {!exercise.skipped && exercise.sets && exercise.sets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
                      {exercise.sets.map((set, sIdx) => (
                        <span
                          key={set.id || sIdx}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold ${
                            set.done
                              ? "bg-[#00ff88]/15 border-[#00ff88]/30 text-[#00ff88]"
                              : "bg-white/5 border-white/5 text-gray-500"
                          }`}
                        >
                          م{sIdx + 1}: {set.weight || "0"} كجم × {set.reps || "0"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. التحليل الذكي للزيادة التدريجية (Progressive Overload Insight) */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-3xl bg-[#0e1628]/90 border border-[#00ff88]/30 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-[#00ff88]" />
          <strong className="text-xs font-black text-[#00ff88]">التحليل التراكمي وتوصية الزيادة التدريجية:</strong>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed m-0">{causeAnalysis}</p>
      </div>

    </div>
  );
}
