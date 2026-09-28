"use client";

import { Suspense, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Activity, ArrowRight, Calendar, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, Flame, Plus, RefreshCw, Search, Sparkles, Trash2, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { syncDataToCloud } from "@/lib/offline-sync";

type SetLog = { id: string; reps: string; weight: string; done: boolean };
type WorkoutExercise = { id: string; name: string; targetSets: number; sets: SetLog[]; skipped: boolean };
type WorkoutDay = { day: number; date: string; status: "planned" | "rest" | "skipped"; exercises: WorkoutExercise[] };

type ApiDay = { exercises: Array<{ name: string; sets?: number } | string> };
type SuggestedExercise = { id: string; name: string; muscle: string; defaultSets?: number };

const systemDays: Record<string, number> = {
  "Push Pull Legs": 6,
  "Arnold Split": 6,
  "Upper / Lower": 4,
  "Full Body": 3,
};

const musclePresets: Record<string, Array<{ name: string; sets: number }>> = {
  "صدر وترايسبس (Chest & Triceps)": [
    { name: "ضغط صدر بالبار المستوي (Bench Press)", sets: 4 },
    { name: "ضغط صدر بالدمبل المائل (Incline Dumbbell Press)", sets: 3 },
    { name: "تجميع صدر بالكابل (Cable Flyes)", sets: 3 },
    { name: "ترايسبس بالحبل (Rope Pushdown)", sets: 4 },
    { name: "ترايسبس بار فرنساوي (Skullcrushers)", sets: 3 },
  ],
  "ظهر وبايسبس (Back & Biceps)": [
    { name: "سحب عالي بالبار (Lat Pulldown)", sets: 4 },
    { name: "سحب أرضي بالماكينة (Seated Cable Row)", sets: 3 },
    { name: "سحب بار T-Bar Row", sets: 4 },
    { name: "بايسبس بالبار (Barbell Curl)", sets: 4 },
    { name: "بايسبس دمبل هامر (Hammer Curl)", sets: 3 },
  ],
  "أرجل وسمانة (Legs & Calves)": [
    { name: "سكوات بالبار (Barbell Squat)", sets: 4 },
    { name: "دفع أرجل بالآلة (Leg Press)", sets: 4 },
    { name: "تمديد أرجل بالآلة (Leg Extension)", sets: 3 },
    { name: "كيرل أرجل خلفي (Seated Leg Curl)", sets: 3 },
    { name: "رفع سمانة واقفاً (Standing Calf Raise)", sets: 4 },
  ],
  "أكتاف وترابيس (Shoulders & Traps)": [
    { name: "ضغط أكتاف بالدمبل (Overhead Dumbbell Press)", sets: 4 },
    { name: "رفرفة جانبي بالدمبل (Lateral Raise)", sets: 4 },
    { name: "سحب حبل وجهي (Face Pulls)", sets: 3 },
    { name: "رفرفة خلفي بالكابل (Rear Delt Flyes)", sets: 3 },
  ],
  "ذراعين كامل (Full Arms: Bi & Tri)": [
    { name: "بايسبس بالبار (Barbell Curl)", sets: 4 },
    { name: "ترايسبس بالحبل (Rope Pushdown)", sets: 4 },
    { name: "بايسبس دمبل هامر (Hammer Curl)", sets: 3 },
    { name: "ترايسبس بار فرنساوي (Skullcrushers)", sets: 3 },
    { name: "كيرل بايسبس على الواعظ (Preacher Curl)", sets: 3 },
  ],
  "بطن وكور وكارديو (Core & Cardio)": [
    { name: "طحن بطن بالكابل (Cable Crunch)", sets: 4 },
    { name: "رفع أرجل معلق (Hanging Leg Raise)", sets: 3 },
    { name: "بلانك ثابت (Plank Hold)", sets: 3 },
  ],
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

function getTodayIndex(): number {
  return (new Date().getDay() + 1) % 7;
}

function createSet(): SetLog {
  return { id: crypto.randomUUID(), reps: "", weight: "", done: false };
}

function createExercise(name: string, targetSets = 4): WorkoutExercise {
  const count = Math.max(1, targetSets);
  const sets = Array.from({ length: count }, () => createSet());
  return { id: crypto.randomUUID(), name, targetSets: count, sets, skipped: false };
}

function createPlan(apiDays: ApiDay[], weekDays: ReturnType<typeof getWeekDays>, activeDays: number): WorkoutDay[] {
  return weekDays.map(({ key }, day) => ({
    day,
    date: key,
    status: day < activeDays ? "planned" : "rest",
    exercises:
      day < activeDays
        ? (apiDays[day]?.exercises ?? []).map((ex) =>
            typeof ex === "string" ? createExercise(ex, 4) : createExercise(ex.name, ex.sets ?? 4)
          )
        : [],
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
  
  // Default selected day to Today's day of week
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());

  const [newExercise, setNewExercise] = useState("");
  const [newTargetSets, setNewTargetSets] = useState(4);
  const [savedNotice, setSavedNotice] = useState(false);
  const [hasSavedSystem, setHasSavedSystem] = useState(false);
  const [savedSystem, setSavedSystem] = useState("");

  // Modals & Suggestion Bank state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedExercise[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState("الكل");
  const [exerciseSearch, setExerciseSearch] = useState("");

  const invalidSystem = !system || !systemDays[system];
  const selectedPlanDay = plan[selectedDay];
  
  // Progress Bar calculation based on Target Sets vs Completed Sets
  const activeExercises = selectedPlanDay?.exercises.filter((ex) => !ex.skipped) ?? [];
  const totalTargetSets = activeExercises.reduce((sum, ex) => sum + (ex.sets.length || ex.targetSets || 1), 0);
  const completedSetsCount = activeExercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0);
  const dayProgress = totalTargetSets > 0 ? Math.round((completedSetsCount / totalTargetSets) * 100) : 0;

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

  // Load Suggested Exercises from /api/exercises
  useEffect(() => {
    const startLoading = window.setTimeout(() => setSuggestionsLoading(true), 0);
    fetch(`/api/exercises?system=${encodeURIComponent(system)}`)
      .then(async (response) => {
        const data = await response.json();
        setSuggestions(data.exercises ?? []);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false));
    return () => window.clearTimeout(startLoading);
  }, [system]);

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
    savePlan(plan.map((day, index) => (index === selectedDay ? updater(day) : day)));
  }

  function updateExercise(exerciseId: string, updater: (exercise: WorkoutExercise) => WorkoutExercise) {
    updateDay((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise)),
    }));
  }

  function addExercise(event?: FormEvent) {
    event?.preventDefault();
    const name = newExercise.trim();
    if (!name) return;
    updateDay((day) => ({
      ...day,
      status: "planned",
      exercises: [...day.exercises, createExercise(name, newTargetSets)],
    }));
    setNewExercise("");
  }

  function addSuggestedExercise(exercise: SuggestedExercise) {
    updateDay((day) => ({
      ...day,
      status: "planned",
      exercises: [...day.exercises, createExercise(exercise.name, exercise.defaultSets ?? 4)],
    }));
  }

  // 1-Click Muscle Routine Swap
  function applyMusclePreset(presetName: string) {
    const presetExercises = musclePresets[presetName];
    if (!presetExercises) return;
    updateDay((day) => ({
      ...day,
      status: "planned",
      exercises: presetExercises.map((p) => createExercise(p.name, p.sets)),
    }));
    setShowSwapModal(false);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  }

  function swapWithAnotherDay(targetDayIndex: number) {
    const targetDay = plan[targetDayIndex];
    if (!targetDay) return;
    updateDay((day) => ({
      ...day,
      status: targetDay.status,
      exercises: targetDay.exercises.map((ex) => createExercise(ex.name, ex.targetSets || ex.sets.length || 4)),
    }));
    setShowSwapModal(false);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  }

  function saveCurrentPlan() {
    savePlan(plan);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  }

  async function saveSystemPlan() {
    const planPayload = {
      system,
      days: plan.map(({ day, exercises }) => ({
        day,
        exercises: exercises.map(({ name, targetSets, sets }) => ({
          name,
          sets: sets.length || targetSets || 4,
        })),
      })),
    };
    syncDataToCloud("/api/workout-plan", planPayload);
    localStorage.setItem("gym-active-system", system);
    localStorage.setItem("gym-system-saved", system);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  }

  const filteredSuggestions = suggestions.filter((ex) => {
    const matchesMuscle = muscleFilter === "الكل" || ex.muscle.includes(muscleFilter);
    const matchesSearch = !exerciseSearch || ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  // 1. SYSTEM SETUP MODE
  if (mode !== "log") {
    return (
      <main className="app-shell pb-24">
        {savedNotice && (
          <div className="saved-toast">
            <CheckCircle2 size={18} className="text-[#00ff88]" />
            <span>تم حفظ نظام التمارين والمجموعات!</span>
          </div>
        )}

        <header className="app-header">
          <Link className="app-back-link" href="/app">
            <ArrowRight size={16} />
            <span>الرئيسية</span>
          </Link>
          <div className="home-logo flex items-center gap-2">
            <img src="/app-logo.png" alt="تَقَدُّم Logo" className="w-8 h-8 rounded-xl object-cover border border-[#00ff88]/40 shadow-[0_0_14px_rgba(0,255,136,0.3)]" />
            <span className="text-lg font-black tracking-tight">تَقَدُّم</span>
          </div>
        </header>

        <section className="app-screen">
          <div className="screen-content plans-screen">
            
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#10182c] to-[#0a0f1d] border border-white/10 mb-4 shadow-xl backdrop-blur-md">
              <span className="screen-kicker">إعداد الخطة والتمارين</span>
              <h1 className="text-xl font-black text-white m-0 mt-1">{system || "اختار نظامك"}</h1>
              <p className="text-xs text-gray-400 mt-1">
                حدد التمارين وعدد المجموعات المستهدفة لكل يوم لحساب نسبة الإنجاز 100% تلقائياً.
              </p>
            </div>

            {/* Days Tabs */}
            <div className="plan-days-slider mb-4">
              {plan.slice(0, systemDays[system] ?? 6).map((day) => {
                const isSelected = selectedDay === day.day;
                return (
                  <button
                    key={day.day}
                    className={`plan-day-tab ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedDay(day.day)}
                  >
                    <span>اليوم {day.day + 1}</span>
                    <span>{day.exercises.length} تمارين</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Setup */}
            {selectedPlanDay && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <strong className="text-sm font-extrabold text-white">تمارين اليوم {selectedPlanDay.day + 1}</strong>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSuggestModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-[#00f0ff] text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>بنك التمارين المقترحة</span>
                    </button>
                    <span className="text-xs text-[#00ff88] font-bold">{selectedPlanDay.exercises.length} تمارين</span>
                  </div>
                </div>

                {/* Exercises Setup List */}
                {selectedPlanDay.exercises.map((exercise) => (
                  <div key={exercise.id} className="p-3.5 rounded-2xl bg-[#0e1628]/85 border border-white/5 flex items-center justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <input
                        value={exercise.name}
                        onChange={(e) => updateExercise(exercise.id, (curr) => ({ ...curr, name: e.target.value }))}
                        className="bg-transparent border-none text-white font-bold text-sm outline-none w-full"
                        aria-label="اسم التمرين"
                      />
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>عدد المجموعات:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={exercise.sets.length || exercise.targetSets}
                          onChange={(e) => {
                            const newCount = Math.max(1, Number(e.target.value) || 1);
                            updateExercise(exercise.id, (curr) => {
                              const diff = newCount - curr.sets.length;
                              let updatedSets = [...curr.sets];
                              if (diff > 0) {
                                updatedSets = [...updatedSets, ...Array.from({ length: diff }, () => createSet())];
                              } else if (diff < 0) {
                                updatedSets = updatedSets.slice(0, newCount);
                              }
                              return { ...curr, targetSets: newCount, sets: updatedSets };
                            });
                          }}
                          className="w-12 bg-black/40 border border-white/10 rounded-lg text-center font-bold text-white py-0.5 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => updateDay((day) => ({ ...day, exercises: day.exercises.filter(({ id }) => id !== exercise.id) }))}
                      className="text-gray-500 hover:text-rose-400 p-2 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {/* Add Custom Exercise Form */}
                <form onSubmit={addExercise} className="p-3.5 rounded-2xl bg-[#0e1628]/70 border border-white/5 backdrop-blur-md space-y-2">
                  <span className="text-xs font-bold text-gray-300 block">إضافة تمرين جديد يدوياً</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newExercise}
                      onChange={(e) => setNewExercise(e.target.value)}
                      placeholder="اكتب اسم تمرين..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00ff88]"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-gray-400">مجموعات:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newTargetSets}
                        onChange={(e) => setNewTargetSets(Number(e.target.value) || 4)}
                        className="w-10 bg-black/40 border border-white/10 rounded-xl py-2 text-center text-xs font-bold text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-[#00ff88] text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>إضافة</span>
                    </button>
                  </div>
                </form>

                {/* Save System Plan Button */}
                <button onClick={saveSystemPlan} className="app-primary-button mt-4 cursor-pointer">
                  <CheckCircle2 size={18} />
                  <span>حفظ النظام والانتقال للتسجيل</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Suggested Exercises Modal (بنك التمارين المقترحة) */}
        {showSuggestModal && (
          <div className="fixed inset-0 z-50 bg-[#05070c]/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl bg-[#0e1628] border border-white/15 p-5 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-[#00f0ff] flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <strong className="text-sm font-black text-white">بنك التمارين المقترحة</strong>
                </div>
                <button onClick={() => setShowSuggestModal(false)} className="text-gray-400 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن اسم التمرين..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-[#00ff88]"
                />
              </div>

              {/* Muscle Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
                {["الكل", "الصدر", "الظهر", "الأرجل", "الأكتاف", "البايسبس", "الترايسبس", "البطن"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMuscleFilter(m)}
                    className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                      muscleFilter === m
                        ? "bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Exercise Items List (High Contrast Text) */}
              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {filteredSuggestions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">لا توجد نتائج مطابقة</div>
                ) : (
                  filteredSuggestions.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3 rounded-2xl bg-black/40 hover:bg-white/5 border border-white/10 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <strong className="block text-sm font-extrabold text-white">{ex.name}</strong>
                        <span className="text-[11px] font-bold text-[#00f0ff] mt-0.5 inline-block">
                          🎯 {ex.muscle} • {ex.defaultSets ?? 4} مجموعات
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          addSuggestedExercise(ex);
                          setSavedNotice(true);
                          window.setTimeout(() => setSavedNotice(false), 1200);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-black text-xs flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                      >
                        <Plus size={14} />
                        <span>إضافة</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // 2. WORKOUT LOG MODE (صفحة تماريني بالأوزان والمجاميع)
  return (
    <main className="app-shell pb-24">
      {savedNotice && (
        <div className="saved-toast">
          <CheckCircle2 size={18} className="text-[#00ff88]" />
          <span>تم حفظ التمارين والأوزان بنجاح!</span>
        </div>
      )}

      <header className="app-header">
        <Link className="app-back-link" href="/app">
          <ArrowRight size={16} />
          <span>الرئيسية</span>
        </Link>
        <div className="home-logo flex items-center gap-2">
          <img src="/app-logo.png" alt="تَقَدُّم Logo" className="w-8 h-8 rounded-xl object-cover border border-[#00ff88]/40 shadow-[0_0_14px_rgba(0,255,136,0.3)]" />
          <span className="text-lg font-black tracking-tight">تَقَدُّم</span>
        </div>
      </header>

      <section className="app-screen">
        <div className="screen-content plans-screen">
          
          {/* Header Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#10182c] to-[#0a0f1d] border border-white/10 mb-4 shadow-xl backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="screen-kicker">سجل تماريني بالأوزان</span>
              <h1 className="text-xl font-black text-white m-0 mt-0.5">{system || "جدول تمارينك"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSwapModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>تبديل تمرينة اليوم</span>
              </button>
              <Link
                href={`/training-plan?system=${encodeURIComponent(system)}&mode=setup`}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition-colors"
              >
                تعديل النظام
              </Link>
            </div>
          </div>

          {/* Days Carousel Tabs (Opens on Today's Day) */}
          <div className="plan-days-slider">
            {weekDays.map(({ label, dateLabel }, index) => {
              const isSelected = selectedDay === index;
              const isToday = index === getTodayIndex();
              return (
                <button
                  key={dateLabel}
                  className={`plan-day-tab ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedDay(index)}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" title="اليوم" />}
                  </span>
                  <span>{dateLabel}</span>
                </button>
              );
            })}
          </div>

          {/* 100% Progress Bar Banner */}
          <div className="p-4 rounded-2xl bg-[#0e1628]/90 border border-white/5 mb-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Activity size={15} className="text-[#00ff88]" />
                <span>نسبة إنجاز تمرين {weekDays[selectedDay]?.label}</span>
              </span>
              <strong className="text-base font-black text-[#00ff88]">{dayProgress}%</strong>
            </div>

            {/* 100% Progress Bar */}
            <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden border border-white/5 p-0.5 mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00ff88] to-[#00f0ff] transition-all duration-500 shadow-[0_0_14px_rgba(0,255,136,0.5)]"
                style={{ width: `${dayProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>{completedSetsCount} من {totalTargetSets} مجموعات مستهدفة مكتملة</span>
              <select
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[11px] text-gray-300 outline-none cursor-pointer"
                value={selectedPlanDay?.status ?? "planned"}
                onChange={(e) => updateDay((day) => ({ ...day, status: e.target.value as WorkoutDay["status"] }))}
              >
                <option value="planned">هتمرن اليوم</option>
                <option value="rest">يوم راحة</option>
                <option value="skipped">لم أتمرن</option>
              </select>
            </div>
          </div>

          {/* Exercise Items List with Weight & Reps Logging */}
          {selectedPlanDay?.status === "skipped" ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-gray-400">
              <p className="m-0 text-sm">تم تحديد هذا اليوم كـ "لم أتمرن"</p>
              <button
                onClick={() => updateDay((day) => ({ ...day, status: "planned" }))}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#00ff88] text-black font-bold text-xs cursor-pointer"
              >
                تفعيل التمرين اليوم
              </button>
            </div>
          ) : selectedPlanDay?.status === "rest" ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-gray-400">
              <p className="m-0 text-sm">يوم راحة واستشفاء عضلي 🧘</p>
              <button
                onClick={() => setShowSwapModal(true)}
                className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs cursor-pointer"
              >
                تبديل لتمرين عضلة أخرى
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPlanDay?.exercises.map((exercise, exerciseIndex) => (
                <article key={exercise.id} className="cyber-exercise-card">
                  
                  {/* Exercise Name & Tools */}
                  <div className="exercise-header-row">
                    <div className="exercise-title-wrap">
                      <div className="exercise-badge-icon">
                        <span className="text-xs font-black">{exerciseIndex + 1}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{exercise.name}</span>
                    </div>

                    <button
                      onClick={() => updateExercise(exercise.id, (curr) => ({ ...curr, skipped: !curr.skipped }))}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                        exercise.skipped
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                          : "bg-white/5 border-white/10 text-gray-300 hover:text-white"
                      }`}
                    >
                      {exercise.skipped ? "ملغى اليوم" : "تجاوز"}
                    </button>
                  </div>

                  {!exercise.skipped && (
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
                            onChange={(e) =>
                              updateExercise(exercise.id, (curr) => ({
                                ...curr,
                                sets: curr.sets.map((s) => (s.id === set.id ? { ...s, weight: e.target.value } : s)),
                              }))
                            }
                            className="cyber-input"
                            aria-label="الوزن بالكيلوجرام"
                          />

                          <input
                            type="number"
                            placeholder="0"
                            value={set.reps}
                            onChange={(e) =>
                              updateExercise(exercise.id, (curr) => ({
                                ...curr,
                                sets: curr.sets.map((s) => (s.id === set.id ? { ...s, reps: e.target.value } : s)),
                              }))
                            }
                            className="cyber-input"
                            aria-label="عدد التكرارات"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              updateExercise(exercise.id, (curr) => ({
                                ...curr,
                                sets: curr.sets.map((s) => (s.id === set.id ? { ...s, done: !s.done } : s)),
                              }))
                            }
                            className={`set-check-btn ${set.done ? "completed" : ""}`}
                            aria-label="تم تنفيذ المجموعة"
                          >
                            <Check size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateExercise(exercise.id, (curr) => ({
                                ...curr,
                                sets: curr.sets.filter((s) => s.id !== set.id),
                              }))
                            }
                            className="text-gray-500 hover:text-rose-400 flex items-center justify-center p-1 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          updateExercise(exercise.id, (curr) => ({
                            ...curr,
                            sets: [...curr.sets, createSet()],
                          }))
                        }
                        className="mt-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/5"
                      >
                        <Plus size={13} className="text-[#00ff88]" />
                        <span>إضافة مجموعة جديدة</span>
                      </button>
                    </div>
                  )}
                </article>
              ))}

              {/* Save All Workout Data Button */}
              <button type="button" onClick={saveCurrentPlan} className="app-primary-button mt-4 cursor-pointer">
                <CheckCircle2 size={18} />
                <span>حفظ التمارين والأوزان المنفذة</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Swap Today's Workout Focus Modal (تبديل تمرينة اليوم) */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 bg-[#05070c]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0e1628] border border-white/15 p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <RefreshCw size={16} />
                </div>
                <strong className="text-sm font-black text-white">تبديل تمرينة اليوم ({weekDays[selectedDay]?.label})</strong>
              </div>
              <button onClick={() => setShowSwapModal(false)} className="text-gray-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              هل ترغب في تغيير عضلة اليوم؟ اختر أي مجموعة عضلية وسيقوم التطبيق بتحميل تمارينها فوراً في هذا اليوم:
            </p>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              <span className="text-[11px] font-bold text-gray-300 block mb-1">1. اختر عضلة بديلة لليوم:</span>
              {Object.keys(musclePresets).map((presetKey) => (
                <button
                  key={presetKey}
                  onClick={() => applyMusclePreset(presetKey)}
                  className="w-full p-3 rounded-2xl bg-black/40 hover:bg-[#00ff88]/10 border border-white/10 hover:border-[#00ff88]/40 flex items-center justify-between text-right transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-[#00ff88]/20 flex items-center justify-center text-white group-hover:text-[#00ff88]">
                      <Dumbbell size={16} />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-white block">{presetKey}</strong>
                      <span className="text-[10px] text-gray-400">
                        {musclePresets[presetKey].length} تمارين مجهزة بالمجموعات
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00ff88] group-hover:translate-x-[-2px] transition-transform">
                    تطبيق اليوم ⬅️
                  </span>
                </button>
              ))}

              <span className="text-[11px] font-bold text-gray-300 block mt-4 mb-1">2. أو انسخ تمارين يوم آخر من جدولك:</span>
              <div className="grid grid-cols-2 gap-2">
                {plan.map((day) => {
                  if (day.day === selectedDay) return null;
                  return (
                    <button
                      key={day.day}
                      onClick={() => swapWithAnotherDay(day.day)}
                      className="p-2.5 rounded-xl bg-black/40 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-right transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white block">اليوم {day.day + 1}</span>
                      <span className="text-[10px] text-gray-400">{day.exercises.length} تمارين مضافة</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
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
