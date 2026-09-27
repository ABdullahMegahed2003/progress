import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";

export const dynamic = "force-static";

export async function GET() {
  try {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({}, { sort: { updatedAt: -1 } });
    return NextResponse.json({ success: true, profile: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, age, avatar } = body;

    const usersCollection = await getUsersCollection();
    await usersCollection.updateOne(
      { email: email || "user@gym.app" },
      { $set: { name, email, age, avatar, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}
