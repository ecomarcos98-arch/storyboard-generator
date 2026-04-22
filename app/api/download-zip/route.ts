import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const zip = new JSZip();

    for (const img of images) {
      const num = String(img.segmentNumber).padStart(3, "0");
      const ext = img.mimeType === "image/jpeg" ? "jpg" : "png";
      const filename = `${num}.${ext}`;
      const buffer = Buffer.from(img.imageBase64, "base64");
      zip.file(filename, buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="storyboard.zip"',
      },
    });
  } catch (error: unknown) {
    console.error("download-zip error:", error);
    return NextResponse.json({ error: "Failed to create ZIP", detail: String(error) }, { status: 500 });
  }
}
