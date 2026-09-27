"use client";

import { useEffect, useState } from "react";
import { Activity, Dumbbell, Flame, Sparkles, Target, TrendingDown, TrendingUp, Trophy, Zap } from "lucide-react";

type SetLog = { reps: string; weight: string; done: boolean };
type WorkoutExercise = { name: string; sets: SetLog[]; skipped: boolean };
type WorkoutDay = { date: string; exercises: WorkoutExercise[]; status: string };
type ExerciseProgress = { name: string; volume: number; sets: number; reps: number; weight: number; change: number };
type Metrics = { volume: number; sets: number; exercises: number; reps: number };
type DayProgress = Metrics & { day: number; label: string; date: string; status: string };
type DailyFactorLog = { date: string; sleep: string; energy: string; effort: string; workoutTime: string; meals: Array<unknown>; work: string; workHours: string };

const dayNames = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

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

function readWeek(system: string, offset: number) {
  const raw = localStorage.getItem(keyFor(system, offset));
  if (!raw) return [] as WorkoutDay[];
  try { return JSON.parse(raw) as WorkoutDay[]; } catch { return []; }
}

function calculate(days: WorkoutDay[]): Metrics {
  let volume = 0; let sets = 0; let exercises = 0; let reps = 0;
  days.forEach((day) => day.exercises?.forEach((exercise) => {
    if (exercise.skipped) return;
    const completed = exercise.sets?.filter((set) => set.done) ?? [];
    if (!completed.length) return;
    exercises += 1; sets += completed.length;
    completed.forEach((set) => { volume += (Number(set.weight) || 0) * (Number(set.reps) || 0); reps += Number(set.reps) || 0; });
  }));
  return { volume, sets, exercises, reps };
}

function calculateDay(day: WorkoutDay, index: number): DayProgress {
  const metrics = calculate([day]);
  return { ...metrics, day: index, label: dayNames[index], date: "", status: day.status };
}

function exerciseRows(currentDays: WorkoutDay[], previousDays: WorkoutDay[]): ExerciseProgress[] {
  const collect = (days: WorkoutDay[]) => {
    const map = new Map<string, ExerciseProgress>();
    days.forEach((day) => day.exercises?.forEach((exercise) => {
      if (exercise.skipped) return;
      const completed = exercise.sets?.filter((set) => set.done) ?? [];
      if (!completed.length) return;
      const item = map.get(exercise.name) ?? { name: exercise.name, volume: 0, sets: 0, reps: 0, weight: 0, change: 0 };
      item.sets += completed.length;
      completed.forEach((set) => { item.volume += (Number(set.weight) || 0) * (Number(set.reps) || 0); item.reps += Number(set.reps) || 0; item.weight = Math.max(item.weight, Number(set.weight) || 0); });
      map.set(exercise.name, item);
    }));
    return map;
  };
  const current = collect(currentDays); const previous = collect(previousDays);
  return [...current.values()].sort((a, b) => b.volume - a.volume).map((item) => ({ ...item, change: previous.get(item.name)?.volume ? Math.round(((item.volume - previous.get(item.name)!.volume) / previous.get(item.name)!.volume) * 100) : 0 }));
}

function percentage(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildMonthlyCauseAnalysis(days: DayProgress[], logs: DailyFactorLog[]) {
  const active = days.filter((day) => day.sets > 0).sort((a, b) => a.volume - b.volume);
  if (active.length < 2 || !logs.length) return "سجل تفاصيل يومك طوال الشهر من زر «سجل اليوم» لمعرفة العوامل المشتركة وراء التطور العضلي.";
  const weakDays = active.slice(0, Math.max(1, Math.ceil(active.length / 3)));
  const strongDays = active.slice(-Math.max(1, Math.ceil(active.length / 3)));
  const weakLogs = weakDays.map((day) => logs.find((log) => log.date === day.date)).filter((log): log is DailyFactorLog => Boolean(log));
  const strongLogs = strongDays.map((day) => logs.find((log) => log.date === day.date)).filter((log): log is DailyFactorLog => Boolean(log));
  if (!weakLogs.length) return `أقل أيام الشهر أداءً كانت ${weakDays.map((day) => day.label).join(" و")}. سجّل تفاصيل هذه الأيام حتى يظهر سبب التراجع.`;
  const factors = [
    { label: "النوم أقل من 7 ساعات", matches: (log: DailyFactorLog) => Number(log.sleep) > 0 && Number(log.sleep) < 7 },
    { label: "الطاقة المنخفضة", matches: (log: DailyFactorLog) => log.energy === "منخفض" },
    { label: "المجهود العالي", matches: (log: DailyFactorLog) => log.effort === "عالي" },
    { label: "أقل من 3 وجبات", matches: (log: DailyFactorLog) => log.meals.length < 3 },
  ];
  const commonFactors = factors.filter((factor) => weakLogs.filter(factor.matches).length >= Math.ceil(weakLogs.length / 2)).map((factor) => factor.label);
  return commonFactors.length ? `العوامل الأكثر تكراراً في أيام التراجع: ${commonFactors.join(" • ")}.` : "أداؤك الشهري مستقر ومتصاعد بشكل ملحوظ!";
}

export function ProgressScreen({ exerciseCount }: { exerciseCount: number }) {
  const [system, setSystem] = useState("");
  const [current, setCurrent] = useState<Metrics>({ volume: 0, sets: 0, exercises: 0, reps: 0 });
  const [previous, setPrevious] = useState<Metrics>({ volume: 0, sets: 0, exercises: 0, reps: 0 });
  const [month, setMonth] = useState<Metrics>({ volume: 0, sets: 0, exercises: 0, reps: 0 });
  const [lastMonth, setLastMonth] = useState<Metrics>({ volume: 0, sets: 0, exercises: 0, reps: 0 });
  const [rows, setRows] = useState<ExerciseProgress[]>([]);
  const [days, setDays] = useState<DayProgress[]>([]);
  const [causeAnalysis, setCauseAnalysis] = useState("");

  useEffect(() => {
    const load = window.setTimeout(() => {
      const savedSystem = localStorage.getItem("gym-system-saved") ?? "";
      const currentDays = readWeek(savedSystem, 0); const previousDays = readWeek(savedSystem, -1);
      const monthDays = Array.from({ length: 4 }, (_, index) => readWeek(savedSystem, -index)).flat();
      const lastMonthDays = Array.from({ length: 4 }, (_, index) => readWeek(savedSystem, -index - 4)).flat();
      setSystem(savedSystem); setCurrent(calculate(currentDays)); setPrevious(calculate(previousDays)); setMonth(calculate(monthDays)); setLastMonth(calculate(lastMonthDays)); setRows(exerciseRows(currentDays, previousDays));
      const dayReport = currentDays.map((day, index) => ({ ...calculateDay(day, index), date: day.date }));
      setDays(dayReport);
      const monthlyDays = Array.from({ length: 5 }, (_, offset) => readWeek(savedSystem, -offset)).flat().map((day, index) => ({ ...calculateDay(day, index % 7), date: day.date }));
      const dailyLogs = monthlyDays.map((day) => localStorage.getItem(`gym-daily-${day.date}`)).filter((raw): raw is string => Boolean(raw)).flatMap((raw) => {
        try { return [JSON.parse(raw) as DailyFactorLog]; } catch { return []; }
      });
      setCauseAnalysis(buildMonthlyCauseAnalysis(monthlyDays, dailyLogs));
    }, 0);
    return () => window.clearTimeout(load);
  }, []);

  const weekChange = percentage(current.volume, previous.volume);
  const monthChange = percentage(month.volume, lastMonth.volume);
  const activeDays = days.filter((day) => day.sets > 0);
  const weakestDay = activeDays.length ? [...activeDays].sort((a, b) => a.volume - b.volume)[0] : null;

  return (
    <div className="screen-content progress-screen-content animate-fade-in pb-8">
      
      {/* Header Greeting */}
      <div className="screen-greeting">
        <div>
          <span className="screen-kicker">تحليل الأداء والتطور</span>
          <h1>
            تقدمك بالأرقام.<br />
            <em>قس نتائجك بدقة.</em>
          </h1>
        </div>
        <div className="mini-avatar">
          <Trophy size={22} className="text-amber-400" />
        </div>
      </div>

      {/* Main Volume Progress Cyberpunk Hero */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#10192e] to-[#0a0f1d] border border-white/10 shadow-2xl backdrop-blur-md mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff88]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-xs font-bold text-gray-400">الحجم التدريبي لهذا الأسبوع</span>
          <span className={`text-xs font-extrabold px-2 py-0.5 rounded flex items-center gap-1 ${
            weekChange >= 0 ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30" : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
          }`}>
            {weekChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{weekChange >= 0 ? "+" : ""}{weekChange}%</span>
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-4 relative z-10">
          <strong className="text-3xl font-black text-white">{current.volume.toLocaleString("ar-EG")}</strong>
          <span className="text-sm font-bold text-[#00ff88]">كجم تم رفعها</span>
        </div>

        {/* Monthly Comparison Pill */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs relative z-10">
          <div>
            <span className="text-gray-400 block text-[10px]">الشهر الحالي</span>
            <strong className="text-white font-extrabold">{month.volume.toLocaleString("ar-EG")} كجم</strong>
          </div>
          <div className="text-left">
            <span className="text-gray-400 block text-[10px]">مقارنة بالشهر السابق</span>
            <span className={`font-black ${monthChange >= 0 ? "text-[#00ff88]" : "text-rose-400"}`}>
              {monthChange >= 0 ? "+" : ""}{monthChange}%
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Badges */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-3 rounded-2xl bg-[#0e1628]/85 border border-white/5 text-center backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[#00ff88] flex items-center justify-center mx-auto mb-1.5">
            <Dumbbell size={16} />
          </div>
          <strong className="text-base font-black text-white block">{current.exercises}</strong>
          <span className="text-[10px] text-gray-400 font-semibold">تمارين منجزة</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#0e1628]/85 border border-white/5 text-center backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[#00f0ff] flex items-center justify-center mx-auto mb-1.5">
            <Zap size={16} />
          </div>
          <strong className="text-base font-black text-white block">{current.sets}</strong>
          <span className="text-[10px] text-gray-400 font-semibold">مجموعات</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#0e1628]/85 border border-white/5 text-center backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-1.5">
            <Target size={16} />
          </div>
          <strong className="text-base font-black text-white block">{current.reps}</strong>
          <span className="text-[10px] text-gray-400 font-semibold">تكرارات</span>
        </div>
      </div>

      {/* Smart Analysis Card */}
      <div className="p-4 rounded-2xl bg-[#0e1628]/90 border border-[#00f0ff]/25 mb-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-[#00f0ff]" />
          <span className="text-xs font-black text-[#00f0ff]">التحليل الذكي للتطور</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed m-0">{causeAnalysis}</p>
      </div>

      {/* Daily Performance Breakdown */}
      <section className="p-4 rounded-2xl bg-[#0e1628]/80 border border-white/5 mb-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Activity size={14} className="text-[#00ff88]" />
            <span>تقرير أداء الأيام (هذا الأسبوع)</span>
          </span>
        </div>

        <div className="space-y-2">
          {days.map((day) => {
            const isWeakest = weakestDay?.day === day.day && day.sets > 0;
            return (
              <div
                key={day.day}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isWeakest
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                    : "bg-black/30 border-white/5 text-white"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-bold">{day.label}</strong>
                    {isWeakest && <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">أقل يوم</span>}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {day.status === "rest" ? "يوم راحة" : day.status === "skipped" ? "لم أتمرن" : `${day.sets} مجموعات • ${day.reps} عدة`}
                  </span>
                </div>
                <strong className="text-xs font-extrabold text-[#00ff88]">
                  {day.volume.toLocaleString("ar-EG")} كجم
                </strong>
              </div>
            );
          })}
        </div>
      </section>

      {/* Exercise by Exercise Progress */}
      <section className="p-4 rounded-2xl bg-[#0e1628]/80 border border-white/5 backdrop-blur-md">
        <span className="text-xs font-bold text-white block mb-3">التقدم حسب كل تمرين</span>
        {rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.name}
                className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between"
              >
                <div>
                  <strong className="text-xs text-white block">{row.name}</strong>
                  <span className="text-[10px] text-gray-400">
                    أقصى وزن {row.weight} كجم • {row.sets} مجموعات
                  </span>
                </div>
                <span className={`text-xs font-extrabold flex items-center gap-1 ${
                  row.change >= 0 ? "text-[#00ff88]" : "text-rose-400"
                }`}>
                  {row.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span>{row.change >= 0 ? "+" : ""}{row.change}%</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 m-0 text-center py-3">
            سجل مجموعاتك في لوحة التمارين لمشاهدة تطور كل تمرين.
          </p>
        )}
      </section>
    </div>
  );
}
