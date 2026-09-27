import { NextResponse } from "next/server";
import { getWorkoutLogsCollection, getPlansCollection, getUsersCollection } from "@/lib/db";

export const dynamic = "force-static";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, data } = body;

    if (endpoint?.includes("workout-plan")) {
      const plansCollection = await getPlansCollection();
      await plansCollection.updateOne(
        { system: data.system },
        { $set: { ...data, updatedAt: new Date() } },
        { upsert: true }
      );
    } else if (endpoint?.includes("workout-log")) {
      const logsCollection = await getWorkoutLogsCollection();
      await logsCollection.updateOne(
        { date: data.date, ...(data.system ? { system: data.system } : {}) },
        { $set: { ...data, updatedAt: new Date() } },
        { upsert: true }
      );
    } else if (endpoint?.includes("profile")) {
      const usersCollection = await getUsersCollection();
      await usersCollection.updateOne(
        { email: data.email || "user@gym.app" },
        { $set: { ...data, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
