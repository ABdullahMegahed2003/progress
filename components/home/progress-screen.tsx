"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Target, Trophy, TrendingDown, TrendingUp } from "lucide-react";

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
  if (active.length < 2 || !logs.length) return "سجل تفاصيل يومك طوال الشهر من زر «سجل يومك» حتى نعرف العوامل المشتركة وراء التطور أو التراجع.";
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
    { label: "عدم تسجيل وقت التمرين", matches: (log: DailyFactorLog) => !log.workoutTime },
  ];
  const commonFactors = factors.filter((factor) => weakLogs.filter(factor.matches).length >= Math.ceil(weakLogs.length / 2)).map((factor) => factor.label);
  const averageSleep = (items: DailyFactorLog[]) => items.reduce((sum, log) => sum + (Number(log.sleep) || 0), 0) / (items.length || 1);
  const sleepDifference = averageSleep(strongLogs) - averageSleep(weakLogs);
  const comparison = sleepDifference > 0.5 ? "وكان نوم الأيام الأقوى أطول في المتوسط" : strongLogs.length ? "ولم يظهر فرق نوم واضح بين المجموعتين" : "وسجّل تفاصيل الأيام الأقوى للمقارنة بشكل أدق";
  return commonFactors.length ? `خلال الشهر، تكررت في أيام الأداء الأضعف عوامل: ${commonFactors.join("، ")}. ${comparison}.` : `لم يظهر عامل مشترك واضح في أيام التراجع خلال الشهر. ${comparison}.`;
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

  const weekChange = percentage(current.volume, previous.volume); const monthChange = percentage(month.volume, lastMonth.volume);
  const activeDays = days.filter((day) => day.sets > 0);
  const weakestDay = activeDays.length ? [...activeDays].sort((a, b) => a.volume - b.volume)[0] : null;
  return (
    <div className="screen-content progress-screen-content">
      <div className="screen-heading"><span className="screen-kicker">تحليل الأداء</span><h1>تقدمك بالأرقام.</h1><p>{system ? `نتائج نظام ${system} من تسجيلاتك الفعلية.` : "احفظ نظامًا وسجل تمرينك حتى يظهر تقدمك هنا."}</p></div>
      <div className="progress-hero"><span>الحجم التدريبي هذا الأسبوع</span><strong>{current.volume.toLocaleString("ar-EG")} <small>كجم</small></strong><b className={weekChange < 0 ? "negative-progress" : ""}>{weekChange >= 0 ? "+" : ""}{weekChange}% <em>مقارنة بالأسبوع السابق</em></b><div className="progress-compare"><span>الشهر الحالي <b>{month.volume.toLocaleString("ar-EG")} كجم</b></span><span>الشهر السابق <b>{lastMonth.volume.toLocaleString("ar-EG")} كجم</b></span><strong className={monthChange < 0 ? "negative-progress" : ""}>{monthChange >= 0 ? "+" : ""}{monthChange}%</strong></div></div>
      <div className="app-stat-grid"><article><Dumbbell size={17} /><strong>{current.exercises}</strong><span>تمارين هذا الأسبوع</span></article><article><Trophy size={17} /><strong>{current.sets}</strong><span>مجموعات مكتملة</span></article><article><Target size={17} /><strong>{current.reps}</strong><span>عدات مكتملة</span></article></div>
      <section className="weakest-day-card"><div><span className="screen-kicker">يحتاج تركيزًا أكثر</span><h2>{weakestDay ? `أقل يوم أداءً: ${weakestDay.label}` : "لا يوجد أداء مسجل"}</h2><p>{weakestDay ? `${weakestDay.volume.toLocaleString("ar-EG")} كجم · ${weakestDay.sets} مجموعات · ${weakestDay.reps} عدة` : "سجل مجموعات مكتملة حتى يظهر تقرير الأيام."}</p></div><Target size={24} /></section>
      <section className="cause-analysis-card"><div><span className="screen-kicker">تحليل ذكي للشهر</span><h2>أسباب التطور أو التراجع</h2><p>{causeAnalysis}</p><small>المقارنة مبنية على الأيام المسجلة وأداء التمرين خلال آخر 5 أسابيع.</small></div><TrendingUp size={22} /></section>
      <section className="daily-progress-section"><div className="progress-section-title"><h2>تقرير أداء الأيام</h2><span>هذا الأسبوع</span></div><div className="daily-progress-list">{days.map((day) => <article className={weakestDay?.day === day.day ? "daily-progress-row weakest" : "daily-progress-row"} key={day.day}><div><strong>{day.label}</strong><small>{day.status === "rest" ? "راحة" : day.status === "skipped" ? "لم أتمرن" : `${day.sets} مجموعات · ${day.reps} عدة`}</small></div><b>{day.volume.toLocaleString("ar-EG")} كجم</b></article>)}</div></section>
      <section className="exercise-progress-section"><div className="progress-section-title"><h2>التقدم حسب التمرين</h2><span>الأسبوع الحالي</span></div>{rows.length ? rows.map((row) => <article className="exercise-progress-row" key={row.name}><div><strong>{row.name}</strong><small>{row.sets} مجموعات · {row.reps} عدة · أقصى وزن {row.weight} كجم</small></div><span className={row.change < 0 ? "negative-progress" : ""}>{row.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{row.change >= 0 ? "+" : ""}{row.change}%</span></article>) : <p className="progress-empty">لم تسجل مجموعات مكتملة بعد. افتح «تماريني» وسجل الوزن والعدات.</p>}</section>
      <p className="available-exercises"><Target size={15} /> {exerciseCount} تمرين متاح في المكتبة</p>
    </div>
  );
}
