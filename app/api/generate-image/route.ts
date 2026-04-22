import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const DELAY_MS = 2000;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { prompt, segmentNumber } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: "16:9",
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        lastError = errText;
        console.error(`Attempt ${attempt} failed:`, errText);
        if (attempt < MAX_RETRIES) await sleep(DELAY_MS);
        continue;
      }

      const data = await response.json();
      const prediction = data.predictions?.[0];

      if (!prediction?.bytesBase64Encoded) {
        lastError = "No image in response";
        if (attempt < MAX_RETRIES) await sleep(DELAY_MS);
        continue;
      }

      return NextResponse.json({
        segmentNumber,
        imageBase64: prediction.bytesBase64Encoded,
        mimeType: prediction.mimeType || "image/png",
      });
    } catch (error: unknown) {
      lastError = String(error);
      if (attempt < MAX_RETRIES) await sleep(DELAY_MS);
    }
  }

  return NextResponse.json(
    { error: "Failed to generate image after retries", detail: lastError },
    { status: 500 }
  );
}
