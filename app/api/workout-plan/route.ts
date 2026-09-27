import { NextResponse } from "next/server";
import { getPlansCollection } from "@/lib/db";

export const dynamic = "force-static";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get("system");
    const plansCollection = await getPlansCollection();

    const plan = await plansCollection.findOne(system ? { system } : {});
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, days } = body;

    if (!system) {
      return NextResponse.json({ success: false, error: "System is required" }, { status: 400 });
    }

    const plansCollection = await getPlansCollection();
    await plansCollection.updateOne(
      { system },
      { $set: { system, days, updatedAt: new Date() } },
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
