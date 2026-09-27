"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Activity, ArrowRight, BatteryCharging, Calendar, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Moon, Plus, Save, Sparkles, Trash2, Utensils, Zap } from "lucide-react";
import Link from "next/link";

type Meal = { id: string; time: string; name: string; details: string };
type DailyLog = {
  date: string;
  sleep: string;
  work: string;
  workHours: string;
  effort: string;
  energy: string;
  workoutTime: string;
  meals: Meal[];
  notes: string;
};
type WorkoutSet = { id: string; reps: string; weight: string; done: boolean };
type WorkoutExercise = { id: string; name: string; skipped: boolean; sets: WorkoutSet[] };
type WorkoutSummary = { system: string; volume: number; sets: number; exercises: WorkoutExercise[] };

const emptyLog = (date: string): DailyLog => ({
  date,
  sleep: "",
  work: "لا يوجد",
  workHours: "",
  effort: "متوسط",
  energy: "متوسط",
  workoutTime: "",
  meals: [],
  notes: "",
});

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
function displayDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
}
function addDays(date: string, amount: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + amount);
  return formatDate(next);
}

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
    const sets = day?.exercises.flatMap((exercise) => (exercise.skipped ? [] : exercise.sets.filter((set) => set.done))) ?? [];
    return {
      system,
      volume: sets.reduce((total, set) => total + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0),
      sets: sets.length,
      exercises: day?.exercises ?? [],
    };
  } catch {
    return { system, volume: 0, sets: 0, exercises: [] };
  }
}

function analyze(log: DailyLog, workout: { volume: number; sets: number }) {
  const reasons: string[] = [];
  const sleep = Number(log.sleep);
  if (sleep && sleep < 7) reasons.push("النوم أقل من 7 ساعات");
  if (log.energy === "منخفض") reasons.push("الطاقة منخفضة");
  if (log.effort === "عالي") reasons.push("مجهود العمل عالي");
  if (log.meals.length < 3) reasons.push("عدد الوجبات غير كافٍ");
  if (!reasons.length) return workout.sets ? "🔥 يومك التدريبي متوازن ومثالي للبناء العضلي!" : "سجل وجباتك ونومك لمتابعة مؤشرات طاقتك واستشفاء عضلاتك.";
  return `العوامل المؤثرة اليوم: ${reasons.join(" • ")}. ${workout.sets ? `أنجزت ${workout.sets} مجموعات بحجم ${workout.volume.toLocaleString("ar-EG")} كجم.` : ""}`;
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
      const next = saved ? (JSON.parse(saved) as DailyLog) : emptyLog(date);
      setLog(next);
      fetch(`/api/workout-log?date=${encodeURIComponent(date)}`)
        .then((response) => response.json())
        .then((data) => setWorkout(data.workout ? summarizeWorkout(data.workout as WorkoutSummary, data.system ?? "") : getWorkoutForDate(date)))
        .catch(() => setWorkout(getWorkoutForDate(date)));
    }, 0);
    return () => window.clearTimeout(load);
  }, [date]);

  function update<K extends keyof DailyLog>(key: K, value: DailyLog[K]) {
    setLog((current) => ({ ...current, [key]: value }));
  }

  function save(event?: FormEvent) {
    event?.preventDefault();
    localStorage.setItem(`gym-daily-${date}`, JSON.stringify(log));
    setNotice("تم حفظ بيانات اليوم بنجاح!");
    window.setTimeout(() => setNotice(""), 2000);
  }

  function addMeal(event: FormEvent) {
    event.preventDefault();
    if (!meal.name.trim()) return;
    update("meals", [...log.meals, { ...meal, id: crypto.randomUUID(), name: meal.name.trim() }]);
    setMeal({ time: "", name: "", details: "" });
  }

  return (
    <main className="app-shell pb-24">
      {/* Toast Notice */}
      {notice && (
        <div className="saved-toast">
          <CheckCircle2 size={18} className="text-[#00ff88]" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <Link className="app-back-link" href="/app">
          <ArrowRight size={16} />
          <span>الرئيسية</span>
        </Link>
        <div className="home-logo flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#00ff88]/20 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.25)]">
            <ClipboardList size={16} />
          </div>
          <span className="text-lg font-black tracking-tight">سجل اليوم</span>
        </div>
      </header>

      <section className="app-screen">
        <div className="screen-content daily-log-screen">
          
          {/* Date Selector Navigation Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#10182c] to-[#0d1424] border border-white/10 mb-4 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setDate(addDays(date, -1))}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors cursor-pointer"
              aria-label="اليوم السابق"
            >
              <ChevronRight size={18} />
            </button>
            <div className="text-center">
              <span className="text-xs font-black text-[#00f0ff] block">{displayDate(date)}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-[11px] text-gray-400 border-none outline-none text-center cursor-pointer"
              />
            </div>
            <button
              onClick={() => setDate(addDays(date, 1))}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors cursor-pointer"
              aria-label="اليوم التالي"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Today's Workout Metrics Pill */}
          <div className="p-4 rounded-2xl bg-[#0e1628]/90 border border-white/5 mb-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Activity size={14} className="text-[#00ff88]" />
                <span>أداء تمرين هذا اليوم</span>
              </span>
              <span className="text-[11px] font-extrabold text-[#00ff88] px-2 py-0.5 rounded bg-[#00ff88]/15 border border-[#00ff88]/30">
                {workout.system || "نظام غير محدد"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                <span className="text-[11px] text-gray-400 block">المجموعات المكتملة</span>
                <strong className="text-base font-black text-white">{workout.sets} مجموعات</strong>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                <span className="text-[11px] text-gray-400 block">الحجم التدريبي الإجمالي</span>
                <strong className="text-base font-black text-[#00f0ff]">
                  {workout.volume.toLocaleString("ar-EG")} كجم
                </strong>
              </div>
            </div>
          </div>

          {/* Daily Form Sections */}
          <form onSubmit={save} className="space-y-4">
            
            {/* 1. Sleep & Energy */}
            <section className="p-4 rounded-2xl bg-[#0e1628]/80 border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Moon size={15} />
                </div>
                <h2 className="text-sm font-bold text-white m-0">النوم ومستوى الطاقة</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] text-gray-300 font-semibold block mb-1">ساعات النوم (بالساعة)</span>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={log.sleep}
                    onChange={(e) => update("sleep", e.target.value)}
                    placeholder="مثال: 7.5"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#00ff88]"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] text-gray-300 font-semibold block mb-1">طاقة ونشاط اليوم</span>
                  <select
                    value={log.energy}
                    onChange={(e) => update("energy", e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#00ff88]"
                  >
                    <option value="عالية">⚡ عالية جداً</option>
                    <option value="متوسط">✨ متوسطة</option>
                    <option value="منخفض">😴 منخفضة</option>
                  </select>
                </label>
              </div>
            </section>

            {/* 2. Meals */}
            <section className="p-4 rounded-2xl bg-[#0e1628]/80 border border-white/5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Utensils size={15} />
                  </div>
                  <h2 className="text-sm font-bold text-white m-0">الوجبات والتغذية</h2>
                </div>
                <span className="text-[11px] text-gray-400">{log.meals.length} وجبات</span>
              </div>

              {/* Meal List */}
              {log.meals.length > 0 && (
                <div className="space-y-2 mb-3">
                  {log.meals.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            {item.time || "بدون وقت"}
                          </span>
                          <strong className="text-xs text-white">{item.name}</strong>
                        </div>
                        {item.details && <p className="text-[11px] text-gray-400 m-0 mt-0.5">{item.details}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => update("meals", log.meals.filter((m) => m.id !== item.id))}
                        className="text-gray-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Meal Inputs */}
              <div className="space-y-2 p-2.5 rounded-xl bg-black/20 border border-white/5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={meal.time}
                    onChange={(e) => setMeal({ ...meal, time: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="اسم الوجبة (غداء، شيك...)"
                    value={meal.name}
                    onChange={(e) => setMeal({ ...meal, name: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="التفاصيل (بروتين، كارب...)"
                    value={meal.details}
                    onChange={(e) => setMeal({ ...meal, details: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={addMeal}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>إضافة</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 3. Daily Notes */}
            <section className="p-4 rounded-2xl bg-[#0e1628]/80 border border-white/5 backdrop-blur-md">
              <span className="text-[11px] text-gray-300 font-semibold block mb-1">ملاحظات وشعور اليوم</span>
              <textarea
                value={log.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="أوزان جديدة حققتها، شعور بالإرهاق، أو ملاحظات خاصة..."
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#00ff88]"
              />
            </section>

            {/* Save Button */}
            <button type="submit" className="app-primary-button cursor-pointer">
              <Save size={16} />
              <span>{notice || "حفظ تسجيل اليوم"}</span>
            </button>
          </form>

          {/* Smart AI Analysis Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1424] to-[#121c33] border border-[#00f0ff]/20 mt-4 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[#00f0ff]" />
              <span className="text-xs font-black text-[#00f0ff]">التحليل الذكي ليومك</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed m-0">{analyze(log, workout)}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function summarizeWorkout(workout: WorkoutSummary, system: string): WorkoutSummary {
  const completedSets = workout.exercises.flatMap((exercise) =>
    exercise.skipped ? [] : exercise.sets.filter((set) => set.done)
  );
  return {
    ...workout,
    system,
    sets: completedSets.length,
    volume: completedSets.reduce((total, set) => total + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0),
  };
}