import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ profile: null });
}

export async function PATCH() {
  return NextResponse.json({ success: true });
}
