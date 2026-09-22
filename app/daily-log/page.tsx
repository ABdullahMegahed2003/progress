"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardList, Plus, Save } from "lucide-react";
import Link from "next/link";

type Meal = { id: string; time: string; name: string; details: string };
type DailyLog = { date: string; sleep: string; work: string; workHours: string; effort: string; energy: string; workoutTime: string; meals: Meal[]; notes: string };
type WorkoutSet = { id: string; reps: string; weight: string; done: boolean };
type WorkoutExercise = { id: string; name: string; skipped: boolean; sets: WorkoutSet[] };
type WorkoutSummary = { system: string; volume: number; sets: number; exercises: WorkoutExercise[] };

const emptyLog = (date: string): DailyLog => ({ date, sleep: "", work: "لا يوجد", workHours: "", effort: "متوسط", energy: "متوسط", workoutTime: "", meals: [], notes: "" });

function formatDate(date: Date) { return date.toISOString().slice(0, 10); }
function displayDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" }); }
function addDays(date: string, amount: number) { const next = new Date(`${date}T12:00:00`); next.setDate(next.getDate() + amount); return formatDate(next); }

function getWorkoutForDate(date: string) {
  const system = localStorage.getItem("gym-system-saved");
  if (!system) return { system: "", volume: 0, sets: 0, exercises: [] } as WorkoutSummary;
  const selected = new Date(`${date}T12:00:00`);
  const weekStart = new Date(selected);
  weekStart.setDate(selected.getDate() - ((selected.getDay() + 1) % 7));
  const key = `gym-workout-${system}-${formatDate(weekStart)}`;
  try {
    const days = JSON.parse(localStorage.getItem(key) ?? "[]") as Array<{ date: string; exercises: WorkoutExercise[] }>;
    const day = days.find((item) => item.date === date);
    const sets = day?.exercises.flatMap((exercise) => exercise.skipped ? [] : exercise.sets.filter((set) => set.done)) ?? [];
    return { system, volume: sets.reduce((total, set) => total + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), sets: sets.length, exercises: day?.exercises ?? [] };
  } catch { return { system, volume: 0, sets: 0, exercises: [] }; }
}

function analyze(log: DailyLog, workout: { volume: number; sets: number }) {
  const reasons: string[] = [];
  const sleep = Number(log.sleep);
  if (sleep && sleep < 7) reasons.push("النوم أقل من 7 ساعات");
  if (log.energy === "منخفض") reasons.push("الطاقة منخفضة");
  if (log.effort === "عالي") reasons.push("مجهود اليوم عالي");
  if (log.meals.length < 3) reasons.push("عدد الوجبات قليل");
  if (!log.workoutTime) reasons.push("لم تسجل وقت التمرين");
  if (!reasons.length) return workout.sets ? "يومك يبدو متوازنًا، واستمر في تسجيل التفاصيل لمقارنة الأداء بدقة." : "سجل التمرين والوجبات والنوم حتى نعرف سبب تغير الأداء.";
  return `العوامل المحتملة اليوم: ${reasons.join("، ")}. ${workout.sets ? `سجلت ${workout.sets} مجموعات بحجم ${workout.volume} كجم.` : "لا توجد مجموعات مكتملة للمقارنة."}`;
}

export default function DailyLogPage() {
  const [date, setDate] = useState(formatDate(new Date()));
  const [log, setLog] = useState<DailyLog>(emptyLog(formatDate(new Date())));
  const [notice, setNotice] = useState("");
  const [workout, setWorkout] = useState<WorkoutSummary>({ system: "", volume: 0, sets: 0, exercises: [] });
  const [meal, setMeal] = useState({ time: "", name: "", details: "" });

  useEffect(() => {
    const load = window.setTimeout(() => {
      const saved = localStorage.getItem(`gym-daily-${date}`);
      const next = saved ? JSON.parse(saved) as DailyLog : emptyLog(date);
      setLog(next);
      fetch(`/api/workout-log?date=${encodeURIComponent(date)}`)
        .then((response) => response.json())
        .then((data) => setWorkout(data.workout ? summarizeWorkout(data.workout as WorkoutSummary, data.system ?? "") : getWorkoutForDate(date)))
        .catch(() => setWorkout(getWorkoutForDate(date)));
    }, 0);
    return () => window.clearTimeout(load);
  }, [date]);

  function update<K extends keyof DailyLog>(key: K, value: DailyLog[K]) { setLog((current) => ({ ...current, [key]: value })); }
  function save(event?: FormEvent) { event?.preventDefault(); localStorage.setItem(`gym-daily-${date}`, JSON.stringify(log)); setNotice("تم حفظ تسجيل اليوم"); window.setTimeout(() => setNotice(""), 1800); }
  function addMeal(event: FormEvent) { event.preventDefault(); if (!meal.name.trim()) return; update("meals", [...log.meals, { ...meal, id: crypto.randomUUID(), name: meal.name.trim() }]); setMeal({ time: "", name: "", details: "" }); }

  return <main className="app-shell"><header className="app-header"><Link className="app-back-link" href="/"><ArrowRight size={16} /> العودة للرئيسية</Link><div className="home-logo">GYM<span>.</span></div></header><section className="app-screen"><div className="screen-content daily-log-screen">
    <div className="screen-heading"><span className="screen-kicker">تسجيل اليوم</span><h1>{displayDate(date)}</h1><p>سجل يومك بهدوء، وبعدها نربط العوامل بأداء تمرينك.</p></div>
    <div className="daily-log-nav"><button onClick={() => setDate(addDays(date, -1))} aria-label="اليوم السابق"><ChevronRight size={18} /></button><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><button onClick={() => setDate(addDays(date, 1))} aria-label="اليوم التالي"><ChevronLeft size={18} /></button></div>
    <section className="daily-workout-summary"><div><span className="screen-kicker">أداء تمرين اليوم</span><h2>{workout.system || "لم يتم اختيار نظام"}</h2><p>{workout.sets ? `${workout.sets} مجموعات مكتملة · ${workout.volume.toLocaleString("ar-EG")} كجم حجم تدريبي` : "سجل المجموعات من صفحة تماريني لربط الأداء بهذا اليوم."}</p></div><ClipboardList size={23} /></section>
    <section className="daily-workout-details"><div className="daily-workout-details-title"><h2>ماذا عملت اليوم؟</h2><span>{workout.exercises.length} تمارين</span></div>{workout.exercises.length ? workout.exercises.map((exercise) => <article className={exercise.skipped ? "daily-exercise skipped" : "daily-exercise"} key={exercise.id}><div className="daily-exercise-heading"><strong>{exercise.name}</strong><span>{exercise.skipped ? "لم يتم" : `${exercise.sets.filter((set) => set.done).length}/${exercise.sets.length} مجموعات`}</span></div>{exercise.skipped ? <small>تم تسجيل التمرين كغير منفذ</small> : <div className="daily-set-list">{exercise.sets.map((set, index) => <div className="daily-set-row" key={set.id}><b>مجموعة {index + 1}</b><span>{set.weight || "0"} كجم</span><span>{set.reps || "0"} عدة</span><span className={set.done ? "set-complete" : "set-incomplete"}>{set.done ? "تم" : "لم يتم"}</span></div>)}</div>}</article>) : <p className="daily-details-empty">لا يوجد تمرين مسجل لهذا اليوم.</p>}</section>
    <form className="daily-log-form" onSubmit={save}>
      <section className="log-section"><h2><span>01</span> النوم والطاقة</h2><div className="log-grid"><label>نمت كام ساعة<input type="number" min="0" max="24" step="0.5" value={log.sleep} onChange={(event) => update("sleep", event.target.value)} placeholder="7.5" /></label><label>طاقة اليوم<select value={log.energy} onChange={(event) => update("energy", event.target.value)}><option>عالية</option><option>متوسط</option><option>منخفض</option></select></label></div></section>
      <section className="log-section"><h2><span>02</span> الشغل والمجهود</h2><div className="log-grid"><label>كان فيه شغل؟<select value={log.work} onChange={(event) => update("work", event.target.value)}><option>لا يوجد</option><option>مكتب</option><option>شغل بدني</option><option>سفر</option></select></label><label>عدد الساعات<input type="number" min="0" max="24" value={log.workHours} onChange={(event) => update("workHours", event.target.value)} placeholder="8" /></label><label>مستوى المجهود<select value={log.effort} onChange={(event) => update("effort", event.target.value)}><option>منخفض</option><option>متوسط</option><option>عالي</option></select></label></div></section>
      <section className="log-section"><h2><span>03</span> الوجبات</h2><div className="meal-list">{log.meals.map((item) => <div className="meal-row" key={item.id}><strong>{item.time || "بدون وقت"}</strong><span>{item.name}<small>{item.details}</small></span><button type="button" onClick={() => update("meals", log.meals.filter((mealItem) => mealItem.id !== item.id))}>حذف</button></div>)}</div><div className="meal-add-row"><input type="time" value={meal.time} onChange={(event) => setMeal({ ...meal, time: event.target.value })} /><input placeholder="اسم الوجبة" value={meal.name} onChange={(event) => setMeal({ ...meal, name: event.target.value })} /><input placeholder="أكلت إيه؟" value={meal.details} onChange={(event) => setMeal({ ...meal, details: event.target.value })} /><button type="button" onClick={addMeal}><Plus size={15} /> إضافة وجبة</button></div></section>
      <section className="log-section"><h2><span>04</span> التمرين والملاحظات</h2><div className="log-grid"><label>تمرنت الساعة<input type="time" value={log.workoutTime} onChange={(event) => update("workoutTime", event.target.value)} /></label><label>ملاحظات اليوم<textarea value={log.notes} onChange={(event) => update("notes", event.target.value)} placeholder="حصل أي شيء جديد؟" /></label></div></section>
      <button className="app-primary-button save-daily-button" type="submit"><Save size={16} /> {notice || "حفظ تسجيل اليوم"}</button>
    </form>
    <section className="daily-analysis"><div><span className="screen-kicker">تحليل ذكي</span><h2>إيه اللي ممكن يأثر على الأداء؟</h2><p>{analyze(log, workout)}</p><small>التحليل يتحدث عندما تحفظ بيانات اليوم وتكمل مجموعات التمرين.</small></div><ClipboardList size={23} /></section>
    <button className="next-day-button" onClick={() => setDate(addDays(date, 1))}>الانتقال لليوم التالي <ChevronLeft size={16} /></button>
  </div></section></main>;
}

function summarizeWorkout(workout: WorkoutSummary, system: string): WorkoutSummary {
  const completedSets = workout.exercises.flatMap((exercise) => exercise.skipped ? [] : exercise.sets.filter((set) => set.done));
  return { ...workout, system, sets: completedSets.length, volume: completedSets.reduce((total, set) => total + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0) };
}