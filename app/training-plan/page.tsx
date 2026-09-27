"use client";

import { Suspense, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Activity, ArrowRight, Calendar, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, Flame, Plus, Sparkles, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { syncDataToCloud } from "@/lib/offline-sync";

type SetLog = { id: string; reps: string; weight: string; done: boolean };
type WorkoutExercise = { id: string; name: string; sets: SetLog[]; skipped: boolean };
type WorkoutDay = { day: number; date: string; status: "planned" | "rest" | "skipped"; exercises: WorkoutExercise[] };

type ApiDay = { exercises: string[] };
type SuggestedExercise = { id: string; name: string; muscle: string };

const systemDays: Record<string, number> = {
  "Push Pull Legs": 6,
  "Arnold Split": 6,
  "Upper / Lower": 4,
  "Full Body": 3,
};

const weekDayNames = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

function getWeekStart(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 1) % 7) + offset * 7);
  return date;
}

function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function getWeekDays(offset: number) {
  const start = getWeekStart(offset);
  return weekDayNames.map((label, day) => {
    const date = new Date(start);
    date.setDate(start.getDate() + day);
    return { label, key: dateKey(date), dateLabel: date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" }) };
  });
}

function createSet(): SetLog {
  return { id: crypto.randomUUID(), reps: "", weight: "", done: false };
}

function createExercise(name: string): WorkoutExercise {
  return { id: crypto.randomUUID(), name, sets: [createSet()], skipped: false };
}

function createPlan(apiDays: ApiDay[], weekDays: ReturnType<typeof getWeekDays>, activeDays: number): WorkoutDay[] {
  return weekDays.map(({ key }, day) => ({
    day,
    date: key,
    status: day < activeDays ? "planned" : "rest",
    exercises: day < activeDays ? (apiDays[day]?.exercises ?? []).map(createExercise) : [],
  }));
}

function TrainingPlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const system = searchParams.get("system") ?? "";
  const mode = searchParams.get("mode") ?? "setup";
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = getWeekDays(weekOffset);
  const weekStart = weekDays[0].key;
  const [plan, setPlan] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(0);
  const [newExercise, setNewExercise] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [hasSavedSystem, setHasSavedSystem] = useState(false);
  const [savedSystem, setSavedSystem] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedExercise[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const invalidSystem = !system || !systemDays[system];
  const selectedPlanDay = plan[selectedDay];
  const daySets = selectedPlanDay?.exercises.flatMap((exercise) => exercise.skipped ? [] : exercise.sets) ?? [];
  const completedDaySets = daySets.filter((set) => set.done).length;
  const dayProgress = daySets.length ? Math.round((completedDaySets / daySets.length) * 100) : 0;

  useEffect(() => {
    const checkSavedSystem = window.setTimeout(() => {
      const storedSystem = localStorage.getItem("gym-system-saved") ?? "";
      setSavedSystem(storedSystem);
      const saved = Boolean(system && storedSystem === system);
      setHasSavedSystem(saved);
      if (mode === "log" && !saved) setLoading(false);
    }, 0);
    return () => window.clearTimeout(checkSavedSystem);
  }, [mode, system]);

  useEffect(() => {
    if (mode === "setup" && savedSystem && system !== savedSystem) {
      router.replace(`/training-plan?system=${encodeURIComponent(savedSystem)}`);
    }
  }, [mode, router, savedSystem, system]);

  useEffect(() => {
    if (invalidSystem) return;
    if (mode === "log" && !hasSavedSystem) return;
    const storageKey = `gym-workout-${system}-${weekStart}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const savedPlan = JSON.parse(saved) as WorkoutDay[];
        const loadSavedPlan = window.setTimeout(() => {
          setPlan(savedPlan);
          setLoading(false);
        }, 0);
        return () => window.clearTimeout(loadSavedPlan);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    fetch("/api/training-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ training: system, days: systemDays[system] }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "تعذر إنشاء الخطة");
        const nextPlan = createPlan(data.exercises ?? [], getWeekDays(weekOffset), systemDays[system]);
        setPlan(nextPlan);
        localStorage.setItem(storageKey, JSON.stringify(nextPlan));
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [hasSavedSystem, invalidSystem, mode, system, weekOffset, weekStart]);

  useEffect(() => {
    if (mode === "log" || invalidSystem) return;
    const startLoading = window.setTimeout(() => setSuggestionsLoading(true), 0);
    fetch(`/api/exercises?system=${encodeURIComponent(system)}&day=${selectedDay}`)
      .then(async (response) => {
        const data = await response.json();
        setSuggestions(data.exercises ?? []);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false));
    return () => window.clearTimeout(startLoading);
  }, [invalidSystem, mode, selectedDay, system]);

  function savePlan(nextPlan: WorkoutDay[]) {
    setPlan(nextPlan);
    localStorage.setItem(`gym-workout-${system}-${weekStart}`, JSON.stringify(nextPlan));
    if (mode === "log") {
      const day = nextPlan[selectedDay];
      if (day) {
        syncDataToCloud("/api/workout-log", { ...day, system });
      }
    }
  }

  function updateDay(updater: (day: WorkoutDay) => WorkoutDay) {
    savePlan(plan.map((day, index) => index === selectedDay ? updater(day) : day));
  }

  function updateExercise(exerciseId: string, updater: (exercise: WorkoutExercise) => WorkoutExercise) {
    updateDay((day) => ({ ...day, exercises: day.exercises.map((exercise) => exercise.id === exerciseId ? updater(exercise) : exercise) }));
  }

  function addExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newExercise.trim();
    if (!name) return;
    updateDay((day) => ({ ...day, status: "planned", exercises: [...day.exercises, createExercise(name)] }));
    setNewExercise("");
  }

  function addSuggestedExercise(exercise: SuggestedExercise) {
    updateDay((day) => ({ ...day, status: "planned", exercises: [...day.exercises, createExercise(exercise.name)] }));
  }

  function addSelectedSuggestion() {
    const exercise = suggestions.find(({ id }) => id === selectedSuggestion);
    if (!exercise) return;
    addSuggestedExercise(exercise);
    setSelectedSuggestion("");
  }

  function moveWeek(direction: number) {
    setLoading(true);
    setError("");
    setSelectedDay(0);
    setWeekOffset((current) => current + direction);
  }

  function openDate(event: ChangeEvent<HTMLInputElement>) {
    const selectedDate = new Date(`${event.target.value}T00:00:00`);
    const currentStart = getWeekStart(0);
    const selectedStart = new Date(selectedDate);
    selectedStart.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 1) % 7));
    const offset = Math.round((selectedStart.getTime() - currentStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    setLoading(true);
    setSelectedDay((selectedDate.getDay() + 1) % 7);
    setWeekOffset(offset);
  }

  function saveCurrentPlan() {
    savePlan(plan);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  }

  async function saveSystemPlan() {
    const planPayload = { system, days: plan.map(({ day, exercises }) => ({ day, exercises: exercises.map(({ name }) => name) })) };
    syncDataToCloud("/api/workout-plan", planPayload);
    localStorage.setItem("gym-active-system", system);
    localStorage.setItem("gym-system-saved", system);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  }

  return (
    <main className="app-shell pb-24">
      {/* Toast Notice */}
      {savedNotice && (
        <div className="saved-toast">
          <CheckCircle2 size={18} className="text-[#00ff88]" />
          <span>تم حفظ التمارين والأوزان بنجاح!</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <Link className="app-back-link" href="/app">
          <ArrowRight size={16} />
          <span>الرئيسية</span>
        </Link>
        <div className="home-logo flex items-center gap-2">
          <img
            src="/app-logo.png"
            alt="تَقَدُّم Logo"
            className="w-8 h-8 rounded-xl object-cover border border-[#00ff88]/40 shadow-[0_0_14px_rgba(0,255,136,0.3)]"
          />
          <span className="text-lg font-black tracking-tight">تَقَدُّم</span>
        </div>
      </header>

      <section className="app-screen">
        <div className="screen-content plans-screen">
          
          {/* Top Title & Header Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#10182c] to-[#0a0f1d] border border-white/10 mb-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="screen-kicker">لوحة التمرين الذكية</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-500/20 text-[#00f0ff] border border-cyan-500/40">
                {mode === "log" ? "وضع التسجيل اليومي" : "إعداد الجدول"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-white m-0">{system || "اختر نظامك"}</h1>
                <p className="text-xs text-gray-400 mt-1">سجل أوزانك وتكراراتك لكل تمرين بدقة متناهية</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)]">
                <Dumbbell size={24} />
              </div>
            </div>
          </div>

          {/* Week Selector Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0d1424]/90 border border-white/5 mb-4 backdrop-blur-md">
            <button
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors cursor-pointer"
              onClick={() => moveWeek(-1)}
              aria-label="الأسبوع السابق"
            >
              <ChevronRight size={18} />
            </button>
            <div className="text-center">
              <span className="text-xs font-black text-[#00f0ff] block">
                {weekOffset === 0 ? "الأسبوع الحالي" : weekOffset < 0 ? `${Math.abs(weekOffset)} أسبوع سابق` : `${weekOffset} أسبوع قادم`}
              </span>
              <span className="text-[10px] text-gray-400">
                {weekDays[0].dateLabel} — {weekDays[6].dateLabel}
              </span>
            </div>
            <button
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors cursor-pointer"
              onClick={() => moveWeek(1)}
              aria-label="الأسبوع التالي"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Days Slider */}
          <div className="plan-days-slider">
            {weekDays.map(({ label, dateLabel }, index) => {
              const isSelected = selectedDay === index;
              return (
                <button
                  key={dateLabel}
                  className={`plan-day-tab ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedDay(index)}
                  role="tab"
                  aria-selected={isSelected}
                >
                  <span>{label}</span>
                  <span>{dateLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Day Progress Ring & Stats */}
          <div className="p-4 rounded-2xl bg-[#0e1628]/80 border border-white/5 mb-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Activity size={14} className="text-[#00ff88]" />
                <span>إنجاز تمرين {weekDays[selectedDay]?.label}</span>
              </span>
              <strong className="text-sm font-black text-[#00ff88]">{dayProgress}%</strong>
            </div>

            {/* Glowing progress bar */}
            <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/5 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00ff88] to-[#00f0ff] transition-all duration-500 shadow-[0_0_12px_rgba(0,255,136,0.5)]"
                style={{ width: `${dayProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
              <span>{completedDaySets} من {daySets.length} مجموعات مكتملة</span>
              <div className="flex items-center gap-2">
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[11px] text-gray-300 outline-none"
                  value={selectedPlanDay?.status ?? "planned"}
                  onChange={(event) => updateDay((day) => ({ ...day, status: event.target.value as WorkoutDay["status"] }))}
                >
                  <option value="planned">هتمرن اليوم</option>
                  <option value="rest">يوم راحة</option>
                  <option value="skipped">لم أتمرن</option>
                </select>
                <button
                  onClick={saveCurrentPlan}
                  className="px-2.5 py-1 rounded-lg bg-[#00ff88]/20 hover:bg-[#00ff88]/30 border border-[#00ff88]/40 text-[#00ff88] font-bold text-[11px] transition-colors cursor-pointer"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>

          {/* Exercise List */}
          {selectedPlanDay?.status === "skipped" ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-gray-400">
              <p className="m-0 text-sm">تم تحديد هذا اليوم كـ "لم أتمرن"</p>
            </div>
          ) : selectedPlanDay?.status === "rest" ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-gray-400">
              <p className="m-0 text-sm">يوم راحة واستشفاء عضلي 🧘</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPlanDay?.exercises.map((exercise, exerciseIndex) => (
                <article key={exercise.id} className="cyber-exercise-card">
                  
                  {/* Exercise Top Row */}
                  <div className="exercise-header-row">
                    <div className="exercise-title-wrap">
                      <div className="exercise-badge-icon">
                        <span className="text-xs font-black">{exerciseIndex + 1}</span>
                      </div>
                      <input
                        value={exercise.name}
                        onChange={(event) => updateExercise(exercise.id, (current) => ({ ...current, name: event.target.value }))}
                        className="bg-transparent border-none text-white font-bold text-sm outline-none w-full"
                        aria-label="اسم التمرين"
                      />
                    </div>
                    <button
                      onClick={() => updateDay((day) => ({ ...day, exercises: day.exercises.filter(({ id }) => id !== exercise.id) }))}
                      className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      aria-label="حذف التمرين"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Sets Table */}
                  <div className="sets-table-wrap">
                    <div className="grid grid-cols-[36px_1fr_1fr_44px_34px] gap-2 px-2 text-[10px] font-extrabold text-gray-400 text-center">
                      <span>#</span>
                      <span>الوزن (كجم)</span>
                      <span>العدات</span>
                      <span>تم</span>
                      <span>حذف</span>
                    </div>

                    {exercise.sets.map((set, setIndex) => (
                      <div key={set.id} className={`set-row-cyber ${set.done ? "done" : ""}`}>
                        <span className="set-index-tag">{setIndex + 1}</span>
                        
                        <input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          value={set.weight}
                          onChange={(e) => updateExercise(exercise.id, (curr) => ({
                            ...curr,
                            sets: curr.sets.map((s) => s.id === set.id ? { ...s, weight: e.target.value } : s)
                          }))}
                          className="cyber-input"
                          aria-label="الوزن بالكيلوجرام"
                        />

                        <input
                          type="number"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) => updateExercise(exercise.id, (curr) => ({
                            ...curr,
                            sets: curr.sets.map((s) => s.id === set.id ? { ...s, reps: e.target.value } : s)
                          }))}
                          className="cyber-input"
                          aria-label="عدد التكرارات"
                        />

                        <button
                          type="button"
                          onClick={() => updateExercise(exercise.id, (curr) => ({
                            ...curr,
                            sets: curr.sets.map((s) => s.id === set.id ? { ...s, done: !s.done } : s)
                          }))}
                          className={`set-check-btn ${set.done ? "completed" : ""}`}
                          aria-label="تم تنفيذ المجموعة"
                        >
                          <Check size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => updateExercise(exercise.id, (curr) => ({
                            ...curr,
                            sets: curr.sets.filter((s) => s.id !== set.id)
                          }))}
                          className="text-gray-500 hover:text-rose-400 flex items-center justify-center p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => updateExercise(exercise.id, (curr) => ({ ...curr, sets: [...curr.sets, createSet()] }))}
                      className="mt-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/5"
                    >
                      <Plus size={13} className="text-[#00ff88]" />
                      <span>إضافة مجموعة جديدة</span>
                    </button>
                  </div>
                </article>
              ))}

              {/* Add New Exercise Form */}
              <form onSubmit={addExercise} className="p-3.5 rounded-2xl bg-[#0e1628]/70 border border-white/5 backdrop-blur-md flex items-center gap-2">
                <input
                  type="text"
                  value={newExercise}
                  onChange={(e) => setNewExercise(e.target.value)}
                  placeholder="اكتب اسم تمرين إضافي..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00ff88]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00d977] text-black font-extrabold text-xs shadow-lg shadow-[#00ff88]/20 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>إضافة</span>
                </button>
              </form>

              {/* Save Plan Main Button */}
              <button
                type="button"
                onClick={saveCurrentPlan}
                className="app-primary-button mt-4 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>حفظ جميع تغييرات التمرين</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function TrainingPlanPage() {
  return (
    <Suspense fallback={<main className="app-shell" />}>
      <TrainingPlanContent />
    </Suspense>
  );
}
