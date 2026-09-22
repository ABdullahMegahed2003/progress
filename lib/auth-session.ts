import { createHmac, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const cookieName = "gym_session";
const sessionLifetime = 60 * 60 * 24 * 180;

function secret() {
  return process.env.SESSION_SECRET || process.env.MONGODB_URI || "local-development-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSessionToken(userId: ObjectId | string) {
  const payload = Buffer.from(JSON.stringify({ sub: String(userId), exp: Date.now() + sessionLifetime * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function setSessionCookie(response: NextResponse, userId: ObjectId | string) {
  response.cookies.set(cookieName, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionLifetime,
    path: "/",
  });
}

export async function getSessionUserId() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  try {
    const expectedSignature = Buffer.from(sign(payload ?? ""));
    const receivedSignature = Buffer.from(signature ?? "");
    if (!payload || !signature || receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    return data.sub && data.exp && data.exp > Date.now() && ObjectId.isValid(data.sub) ? new ObjectId(data.sub) : null;
  } catch {
    return null;
  }
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(cookieName, "", { httpOnly: true, expires: new Date(0), path: "/" });
}
