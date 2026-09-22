import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ plan: null });
}

export async function PUT() {
  return NextResponse.json({ success: true });
}
