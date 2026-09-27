import { NextResponse } from "next/server";

export const dynamic = "force-static";

export const exerciseDatabase = [
  // Chest
  { id: "ex-1", name: "ضغط صدر بالبار المستوي (Bench Press)", muscle: "الصدر", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-2", name: "ضغط صدر بالدمبل المائل (Incline Dumbbell Press)", muscle: "الصدر العلي", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-3", name: "تجميع صدر بالكابل (Cable Flyes)", muscle: "الصدر", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-4", name: "ضغط صدر بالآلة (Chest Press Machine)", muscle: "الصدر", system: "Arnold Split", defaultSets: 4 },

  // Back
  { id: "ex-5", name: "سحب عالي بالبار (Lat Pulldown)", muscle: "الظهر العريض", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-6", name: "سحب أرضي بالماكينة (Seated Cable Row)", muscle: "الظهر الأوسط", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-7", name: "سحب بار T-Bar Row", muscle: "الظهر", system: "Arnold Split", defaultSets: 4 },
  { id: "ex-8", name: "رفعة ميتة (Deadlift)", muscle: "الظهر وأوتار المأبض", system: "Push Pull Legs", defaultSets: 3 },

  // Legs
  { id: "ex-9", name: "سكوات بالبار (Barbell Squat)", muscle: "الأرجل الأمامية", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-10", name: "دفع أرجل بالآلة (Leg Press)", muscle: "الأرجل", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-11", name: "تمديد أرجل بالآلة (Leg Extension)", muscle: "الأرجل الأمامية", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-12", name: "كيرل أرجل خلفي (Seated Leg Curl)", muscle: "الأرجل الخلفية", system: "Full Body", defaultSets: 3 },
  { id: "ex-13", name: "رفع سمانة (Calf Raise)", muscle: "السمانة", system: "Push Pull Legs", defaultSets: 4 },

  // Shoulders
  { id: "ex-14", name: "ضغط أكتاف بالدمبل (Overhead Dumbbell Press)", muscle: "الأكتاف", system: "Arnold Split", defaultSets: 4 },
  { id: "ex-15", name: "رفرفة جانبي بالدمبل (Lateral Raise)", muscle: "الأكتاف الجانبية", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-16", name: "سحب حبل وجهي (Face Pulls)", muscle: "الأكتاف الخلفية", system: "Push Pull Legs", defaultSets: 3 },

  // Arms
  { id: "ex-17", name: "بايسبس بالبار (Barbell Curl)", muscle: "البايسبس", system: "Arnold Split", defaultSets: 4 },
  { id: "ex-18", name: "بايسبس دمبل هامر (Hammer Curl)", muscle: "البايسبس والساعد", system: "Arnold Split", defaultSets: 3 },
  { id: "ex-19", name: "ترايسبس بالحبل (Rope Pushdown)", muscle: "الترايسبس", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-20", name: "ترايسبس بار فرنساوي (Skullcrushers)", muscle: "الترايسبس", system: "Arnold Split", defaultSets: 3 },
];

export async function GET(request: Request) {
  let muscleFilter: string | null = null;
  let systemFilter: string | null = null;

  try {
    if (request && request.url) {
      const { searchParams } = new URL(request.url);
      muscleFilter = searchParams.get("muscle");
      systemFilter = searchParams.get("system");
    }
  } catch {
    // Static export prerender fallback
  }

  let filtered = exerciseDatabase;
  if (muscleFilter) {
    filtered = filtered.filter((ex) => ex.muscle.includes(muscleFilter));
  }
  if (systemFilter) {
    filtered = filtered.filter((ex) => ex.system === systemFilter);
  }

  return NextResponse.json({
    success: true,
    exercises: filtered.length ? filtered : exerciseDatabase,
    count: exerciseDatabase.length,
    muscles: Array.from(new Set(exerciseDatabase.map((e) => e.muscle))),
  });
}
