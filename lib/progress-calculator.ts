export type SetLog = {
  id?: string;
  reps: string;
  weight: string;
  done: boolean;
};

export type WorkoutExercise = {
  id?: string;
  name: string;
  sets: SetLog[];
  skipped?: boolean;
};

export type WorkoutDay = {
  day: number;
  date: string;
  status: "planned" | "rest" | "skipped";
  exercises: WorkoutExercise[];
};

export type ProgressMetrics = {
  volume: number; // إجمالي الحجم التدريبي (كجم)
  totalSets: number; // عدد المجموعات المكتملة
  totalReps: number; // عدد العدات المكتملة
  maxWeight: number; // أقصى وزن مرفوع (كجم)
  activeDaysCount: number; // عدد الأيام النشطة
};

export type DayActivity = {
  dayName: string;
  date: string;
  progressPercent: number;
  completedSets: number;
  totalSets: number;
  isRest: boolean;
  isSkipped: boolean;
};

export type ProgressComparison = {
  currentMetrics: ProgressMetrics;
  previousMetrics: ProgressMetrics;
  volumeChangePercent: number; // نسبة التطور في الحجم التدريبي
  weightChangePercent: number; // نسبة التطور في الأوزان
  repsChangePercent: number; // نسبة التطور في العدات
  setsChangePercent: number; // نسبة التطور في المجموعات
};

export const DAY_NAMES_AR = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

/**
 * Calculate metrics for a list of workout days
 */
export function calculateMetrics(days: WorkoutDay[]): ProgressMetrics {
  let volume = 0;
  let totalSets = 0;
  let totalReps = 0;
  let maxWeight = 0;
  let activeDaysCount = 0;

  days.forEach((day) => {
    let dayHasSets = false;
    day.exercises?.forEach((exercise) => {
      if (exercise.skipped) return;
      const doneSets = exercise.sets?.filter((s) => s.done) ?? [];
      if (doneSets.length > 0) dayHasSets = true;

      totalSets += doneSets.length;
      doneSets.forEach((set) => {
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        volume += w * r;
        totalReps += r;
        if (w > maxWeight) maxWeight = w;
      });
    });
    if (dayHasSets) activeDaysCount++;
  });

  return {
    volume,
    totalSets,
    totalReps,
    maxWeight,
    activeDaysCount,
  };
}

/**
 * Compare two metric periods (current vs previous) and compute percentage changes
 */
export function compareMetrics(current: ProgressMetrics, previous: ProgressMetrics): ProgressComparison {
  const calcPercent = (curr: number, prev: number) => {
    if (!prev) return curr ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    currentMetrics: current,
    previousMetrics: previous,
    volumeChangePercent: calcPercent(current.volume, previous.volume),
    weightChangePercent: calcPercent(current.maxWeight, previous.maxWeight),
    repsChangePercent: calcPercent(current.totalReps, previous.totalReps),
    setsChangePercent: calcPercent(current.totalSets, previous.totalSets),
  };
}

/**
 * Calculate weekly activity breakdown for the 7 days
 */
export function calculateWeeklyActivity(days: WorkoutDay[]): DayActivity[] {
  return DAY_NAMES_AR.map((dayName, index) => {
    const dayData = days[index] || { day: index, date: "", status: "planned", exercises: [] };
    const allSets = dayData.exercises?.flatMap((e) => (e.skipped ? [] : e.sets)) ?? [];
    const completedSets = allSets.filter((s) => s.done).length;
    const progressPercent = allSets.length ? Math.round((completedSets / allSets.length) * 100) : 0;

    return {
      dayName,
      date: dayData.date || "",
      progressPercent,
      completedSets,
      totalSets: allSets.length,
      isRest: dayData.status === "rest",
      isSkipped: dayData.status === "skipped",
    };
  });
}
