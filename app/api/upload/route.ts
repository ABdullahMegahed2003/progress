import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-static";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { image } = body;
    if (!image) {
      return NextResponse.json({ success: false, error: "Image data is required" }, { status: 400 });
    }

    const apiKey = process.env.CLOUDINARY_API_KEY || "541995528699528";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "q7eJphnXToL5CiYe_qwT25byF48";
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "progress-gym";

    const timestamp = Math.floor(Date.now() / 1000);
    const signatureStr = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new FormData();
    formData.append("file", image);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const cloudRes = await fetch(cloudUrl, {
      method: "POST",
      body: formData,
    });

    const cloudData = await cloudRes.json();
    if (cloudData.secure_url) {
      return NextResponse.json({ success: true, url: cloudData.secure_url });
    }

    return NextResponse.json({ success: false, error: cloudData.error?.message || "Cloudinary Upload Failed" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
