import { NextResponse } from "next/server";
import { getWorkoutLogsCollection } from "@/lib/db";

export const dynamic = "force-static";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const system = searchParams.get("system");
    const logsCollection = await getWorkoutLogsCollection();

    if (date) {
      const log = await logsCollection.findOne({ date, ...(system ? { system } : {}) });
      return NextResponse.json({ success: true, workout: log });
    }

    const logs = await logsCollection.find(system ? { system } : {}).limit(60).toArray();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, system, exercises, day, status } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 });
    }

    const logsCollection = await getWorkoutLogsCollection();
    await logsCollection.updateOne(
      { date, ...(system ? { system } : {}) },
      { $set: { date, system, exercises, day, status, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
