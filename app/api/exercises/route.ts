import { NextResponse } from "next/server";

export const dynamic = "force-static";

export const exerciseDatabase = [
  // Chest (الصدر)
  { id: "ex-1", name: "ضغط صدر بالبار المستوي (Bench Press)", muscle: "الصدر", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-2", name: "ضغط صدر بالدمبل المائل (Incline Dumbbell Press)", muscle: "الصدر العالي", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-3", name: "تجميع صدر بالكابل (Cable Flyes)", muscle: "الصدر", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-4", name: "ضغط صدر بالآلة (Chest Press Machine)", muscle: "الصدر", system: "Arnold Split", defaultSets: 4 },
  { id: "ex-4b", name: "متوازي للصدر (Chest Dips)", muscle: "الصدر السفلي", system: "Push Pull Legs", defaultSets: 3 },

  // Back (الظهر)
  { id: "ex-5", name: "سحب عالي بالبار (Lat Pulldown)", muscle: "الظهر العريض", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-6", name: "سحب أرضي بالماكينة (Seated Cable Row)", muscle: "الظهر الأوسط", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-7", name: "سحب بار T-Bar Row", muscle: "الظهر", system: "Arnold Split", defaultSets: 4 },
  { id: "ex-8", name: "رفعة ميتة (Deadlift)", muscle: "الظهر السفلي", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-8b", name: "سحب دمبل فردي (One-Arm Dumbbell Row)", muscle: "الظهر العريض", system: "Upper / Lower", defaultSets: 3 },

  // Legs (الأرجل)
  { id: "ex-9", name: "سكوات بالبار (Barbell Squat)", muscle: "الأرجل الأمامية", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-10", name: "دفع أرجل بالآلة (Leg Press)", muscle: "الأرجل", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-11", name: "تمديد أرجل بالآلة (Leg Extension)", muscle: "الأرجل الأمامية", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-12", name: "كيرل أرجل خلفي (Seated Leg Curl)", muscle: "الأرجل الخلفية", system: "Full Body", defaultSets: 3 },
  { id: "ex-13", name: "رفع سمانة واقفاً (Standing Calf Raise)", muscle: "السمانة", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-13b", name: "لانجز بالدمبل (Dumbbell Lunges)", muscle: "الأرجل والمؤخرة", system: "Upper / Lower", defaultSets: 3 },

  // Shoulders (الأكتاف)
  { id: "ex-14", name: "ضغط أكتاف بالدمبل (Overhead Dumbbell Press)", muscle: "الأكتاف الأمامية", system: "Arnold Split", defaultSets: 4 },
  { id: "ex-15", name: "رفرفة جانبي بالدمبل (Lateral Raise)", muscle: "الأكتاف الجانبية", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-16", name: "سحب حبل وجهي (Face Pulls)", muscle: "الأكتاف الخلفية", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-16b", name: "رفرفة خلفي بالكابل (Rear Delt Flyes)", muscle: "الأكتاف الخلفية", system: "Arnold Split", defaultSets: 3 },

  // Arms (الذراعين)
  { id: "ex-17", name: "بايسبس بالبار (Barbell Curl)", muscle: "البايسبس", system: "Arnold Split", defaultSets: 4 },
  { id: "ex-18", name: "بايسبس دمبل هامر (Hammer Curl)", muscle: "البايسبس والساعد", system: "Arnold Split", defaultSets: 3 },
  { id: "ex-18b", name: "كيرل بايسبس على الواعظ (Preacher Curl)", muscle: "البايسبس", system: "Arnold Split", defaultSets: 3 },
  { id: "ex-19", name: "ترايسبس بالحبل (Rope Pushdown)", muscle: "الترايسبس", system: "Push Pull Legs", defaultSets: 4 },
  { id: "ex-20", name: "ترايسبس بار فرنساوي (Skullcrushers)", muscle: "الترايسبس", system: "Arnold Split", defaultSets: 3 },
  { id: "ex-20b", name: "ترايسبس غطس (Tricep Dips)", muscle: "الترايسبس", system: "Push Pull Legs", defaultSets: 3 },

  // Abs & Core (البطن والكور)
  { id: "ex-21", name: "طحن بطن بالكابل (Cable Crunch)", muscle: "البطن", system: "Full Body", defaultSets: 4 },
  { id: "ex-22", name: "رفع أرجل معلق (Hanging Leg Raise)", muscle: "أسفل البطن", system: "Push Pull Legs", defaultSets: 3 },
  { id: "ex-23", name: "بلانك ثابت (Plank Hold)", muscle: "الكور والبطن", system: "Full Body", defaultSets: 3 },
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
