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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
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
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);

      if (!imagePart?.inlineData) {
        lastError = "No image in response";
        if (attempt < MAX_RETRIES) await sleep(DELAY_MS);
        continue;
      }

      return NextResponse.json({
        segmentNumber,
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || "image/png",
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
