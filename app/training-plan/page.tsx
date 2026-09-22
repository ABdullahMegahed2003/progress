"use client";

import { Suspense, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
      if (day) fetch("/api/workout-log", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(day) }).catch(() => undefined);
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
    const response = await fetch("/api/workout-plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, days: plan.map(({ day, exercises }) => ({ day, exercises: exercises.map(({ name }) => name) })) }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "تعذر حفظ النظام");
      return;
    }
    localStorage.setItem("gym-active-system", system);
    localStorage.setItem("gym-system-saved", system);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  }

  if (mode !== "log") {
    return (
      <main className="app-shell">
        <header className="app-header"><Link className="app-back-link" href="/"><ArrowRight size={16} /> العودة للرئيسية</Link><div className="home-logo">GYM<span>.</span></div></header>
        <section className="app-screen"><div className="screen-content plans-screen">
          <div className="screen-heading"><span className="screen-kicker">إعداد النظام</span><h1>{system || "اختار نظامك"}</h1><p>اختار تمارين النظام فقط. تسجيل الوزن والعدات موجود في صفحة تماريني.</p>
            {hasSavedSystem ? <div className="system-current"><span>نظامك المحفوظ</span><strong>{system}</strong></div> : <label className="system-picker">نظام التدريب<select value={system} onChange={(event) => router.push(`/training-plan?system=${encodeURIComponent(event.target.value)}`)}>{Object.keys(systemDays).map((name) => <option key={name} value={name}>{name}</option>)}</select></label>}
          </div>
          {loading && !invalidSystem && <p className="exercise-loading">جارٍ تحميل تمارين النظام...</p>}
          {(error || invalidSystem) && <p className="form-message" role="alert">{error || "نظام التدريب غير صحيح"}</p>}
          {!loading && !error && !invalidSystem && <div className="setup-plan-list">
            <div className="setup-day-tabs" role="tablist">{plan.slice(0, systemDays[system]).map((day) => <button className={selectedDay === day.day ? "selected" : ""} key={day.day} onClick={() => setSelectedDay(day.day)} role="tab" aria-selected={selectedDay === day.day}>اليوم {day.day + 1}<small>{day.exercises.length}</small></button>)}</div>
            {selectedPlanDay && <div className="setup-day"><div className="setup-day-title"><strong>تمارين اليوم {selectedPlanDay.day + 1}</strong><span>{selectedPlanDay.exercises.length} تمارين</span></div>{selectedPlanDay.exercises.map((exercise) => <div className="setup-exercise" key={exercise.id}><input value={exercise.name} aria-label="اسم التمرين" onChange={(event) => updateExercise(exercise.id, (current) => ({ ...current, name: event.target.value }))} /><button className="delete-exercise" aria-label="حذف التمرين" onClick={() => updateDay((currentDay) => ({ ...currentDay, exercises: currentDay.exercises.filter(({ id }) => id !== exercise.id) }))}><Trash2 size={15} /></button></div>)}<div className="add-exercise-row"><input value={newExercise} onChange={(event) => setNewExercise(event.target.value)} placeholder="اكتب تمرينًا..." /><button className="add-exercise-action" onClick={() => { const name = newExercise.trim(); if (!name) return; updateDay((day) => ({ ...day, exercises: [...day.exercises, createExercise(name)] })); setNewExercise(""); }}><Plus size={14} /> إضافة</button><select value={selectedSuggestion} onChange={(event) => setSelectedSuggestion(event.target.value)} disabled={suggestionsLoading}><option value="">اختار تمرين</option>{suggestions.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name} - {exercise.muscle}</option>)}</select><button className="add-exercise-action" onClick={addSelectedSuggestion} disabled={!selectedSuggestion}><Plus size={14} /> إضافة الاقتراح</button></div></div>}
            <button className="app-primary-button save-system-button" onClick={saveSystemPlan}>{savedNotice ? "تم حفظ النظام" : "حفظ النظام والتمارين"}</button>
          </div>}
        </div></section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <Link className="app-back-link" href="/"><ArrowRight size={16} /> العودة للرئيسية</Link>
        <div className="home-logo">GYM<span>.</span></div>
      </header>
      <section className="app-screen">
        <div className="screen-content plans-screen">
          <div className="screen-heading">
            <span className="screen-kicker">سجل التمرين</span>
            <h1>{system || "خطتك"}</h1>
            <p>سجل الوزن والعدات لكل مجموعة، وارجع لأي أسبوع وقت ما تحب.</p>
            <div className="system-current"><span>نظامك المحفوظ</span><strong>{system}</strong></div>
          </div>

          <div className="week-switcher">
            <button className="week-arrow" onClick={() => moveWeek(-1)} aria-label="الأسبوع السابق"><ChevronRight size={18} /></button>
            <strong>{weekOffset === 0 ? "هذا الأسبوع" : weekOffset < 0 ? `${Math.abs(weekOffset)} أسبوع سابق` : `${weekOffset} أسبوع قادم`}</strong>
            <button className="week-arrow" onClick={() => moveWeek(1)} aria-label="الأسبوع التالي"><ChevronLeft size={18} /></button>
            <label className="date-picker">اختار تاريخًا<input type="date" value={weekDays[selectedDay]?.key ?? ""} onChange={openDate} /></label>
          </div>

          {loading && !invalidSystem && (mode !== "log" || hasSavedSystem) && <p className="exercise-loading">جارٍ تجهيز سجل الأسبوع...</p>}
          {!loading && mode === "log" && !hasSavedSystem && <div className="empty-workout-state"><CalendarDays size={28} /><h2>لا يوجد تمرين محفوظ</h2><p>اختار نظامك وأضف تمارينك ثم اضغط حفظ النظام أولًا.</p><div className="workout-progress empty-progress"><div className="workout-progress-label"><span>إنجاز تمرين اليوم</span><strong>0%</strong></div><div className="workout-progress-track"><span style={{ width: "0%" }} /></div><small>لم يتم تسجيل مجموعات بعد</small></div><Link className="app-primary-button" href={`/training-plan?system=${encodeURIComponent(system || "Push Pull Legs")}`}>إعداد النظام</Link></div>}
          {(error || invalidSystem) && <p className="form-message" role="alert">{error || "نظام التدريب غير صحيح"}</p>}

          {!loading && !error && !invalidSystem && (mode !== "log" || hasSavedSystem) && (
            <div className="training-plan standalone-plan">
              <div className="plan-header"><CalendarDays size={18} /><h3>{weekDays[0].dateLabel} إلى {weekDays[6].dateLabel}</h3></div>
              <div className="week-days" role="tablist" aria-label="أيام الأسبوع">
                {weekDays.map(({ label, dateLabel }, index) => (
                  <button className={selectedDay === index ? "week-day selected" : "week-day"} key={dateLabel} onClick={() => setSelectedDay(index)} role="tab" aria-selected={selectedDay === index}>
                    <strong>{label}</strong><small>{dateLabel}</small>
                  </button>
                ))}
              </div>

              <div className="selected-day-heading">
                <div><span className="screen-kicker">تمرين اليوم</span><h2>{weekDays[selectedDay].label} — {weekDays[selectedDay].dateLabel}</h2></div>
                <div className="day-actions"><select className="day-status-select" value={selectedPlanDay?.status ?? "planned"} onChange={(event) => updateDay((day) => ({ ...day, status: event.target.value as WorkoutDay["status"] }))}><option value="planned">هتمرن</option><option value="rest">راحة</option><option value="skipped">لم أتمرن</option></select><button className="save-log-button" onClick={saveCurrentPlan}>{savedNotice ? "تم الحفظ" : "حفظ"}</button></div>
              </div>

              <div className="workout-progress"><div className="workout-progress-label"><span>إنجاز تمرين اليوم</span><strong>{dayProgress}%</strong></div><div className="workout-progress-track"><span style={{ width: `${dayProgress}%` }} /></div><small>{completedDaySets} من {daySets.length} مجموعات مكتملة</small></div>

              {selectedPlanDay?.status === "skipped" ? <p className="skipped-message">اليوم متسجل: لم أتمرن</p> : selectedPlanDay?.status === "rest" ? <p className="skipped-message">يوم راحة</p> : (
                <>
                  <div className="logged-exercises">
                    {selectedPlanDay?.exercises.map((exercise, exerciseIndex) => (
                      <article className={exercise.skipped ? "logged-exercise skipped" : "logged-exercise"} key={exercise.id}>
                        <div className="logged-exercise-head">
                          <input value={exercise.name} aria-label="اسم التمرين" onChange={(event) => updateExercise(exercise.id, (current) => ({ ...current, name: event.target.value }))} />
                          <button className="delete-exercise" aria-label="حذف التمرين" onClick={() => updateDay((day) => ({ ...day, exercises: day.exercises.filter(({ id }) => id !== exercise.id) }))}><Trash2 size={16} /></button>
                        </div>
                        <div className="exercise-log-tools"><span>التمرين {exerciseIndex + 1}</span><button onClick={() => updateExercise(exercise.id, (current) => ({ ...current, skipped: !current.skipped }))}>{exercise.skipped ? "تسجيل التمرين" : "لم أتمرنه"}</button></div>
                        {!exercise.skipped && <>
                          <div className="set-log-head"><span>المجموعة</span><span>الوزن (كجم)</span><span>العدات</span><span>تم</span></div>
                          {exercise.sets.map((set, setIndex) => <div className="set-log-row" key={set.id}><b>{setIndex + 1}</b><input inputMode="decimal" value={set.weight} placeholder="0" aria-label="الوزن" onChange={(event) => updateExercise(exercise.id, (current) => ({ ...current, sets: current.sets.map((item) => item.id === set.id ? { ...item, weight: event.target.value } : item) }))} /><input inputMode="numeric" value={set.reps} placeholder="0" aria-label="العدات" onChange={(event) => updateExercise(exercise.id, (current) => ({ ...current, sets: current.sets.map((item) => item.id === set.id ? { ...item, reps: event.target.value } : item) }))} /><input className="set-done" type="checkbox" checked={set.done} aria-label="تم تنفيذ المجموعة" onChange={(event) => updateExercise(exercise.id, (current) => ({ ...current, sets: current.sets.map((item) => item.id === set.id ? { ...item, done: event.target.checked } : item) }))} /></div>)}
                          <button className="add-set-button" onClick={() => updateExercise(exercise.id, (current) => ({ ...current, sets: [...current.sets, createSet()] }))}><Plus size={14} /> مجموعة جديدة</button>
                        </>}
                      </article>
                    ))}
                  </div>
                  <form className="add-exercise-form" onSubmit={addExercise}><input value={newExercise} onChange={(event) => setNewExercise(event.target.value)} placeholder="اكتب اسم تمرين جديد..." aria-label="إضافة تمرين جديد" /><button className="app-primary-button" type="submit"><Plus size={16} /> إضافة تمرين</button></form>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function TrainingPlanPage() {
  return <Suspense fallback={<main className="app-shell" />}><TrainingPlanContent /></Suspense>;
}
