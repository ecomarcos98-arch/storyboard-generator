import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { script, styleNotes } = await req.json();

    if (!script?.trim()) {
      return NextResponse.json({ error: "Script is required" }, { status: 400 });
    }

    const words = script.trim().split(/\s+/).filter(Boolean).length;
    const segmentCount = Math.max(1, Math.ceil((words / 2.5) / 5));

    const systemPrompt = `You are a professional storyboard director. Your task is to analyze a narration script and prepare it for storyboard generation.

STEP 1 - CHARACTER EXTRACTION:
Identify every character mentioned in the script. For each character, create a detailed, consistent visual description. Include:
- Age appearance, gender, ethnicity
- Hair color, style, and length
- Eye color
- Clothing (very specific: colors, patterns, materials)
- Body type and height
- Any distinguishing features
- Art style: 3D Pixar-style cartoon character with soft rounded features, expressive eyes, smooth skin textures

STEP 2 - SCRIPT SEGMENTATION:
Divide the script into exactly ${segmentCount} segments of roughly equal word count (~12-13 words each). Each segment represents 5 seconds of narration.

STEP 3 - IMAGE PROMPT GENERATION:
For each segment, write a detailed image generation prompt in English. Each prompt MUST:
- Be completely self-contained (no memory between images)
- Include the FULL character description for every character present in the scene
- Describe the setting, lighting, time of day, weather
- Specify the camera angle (wide shot, close-up, medium shot, bird's eye view, etc.)
- Include the emotional tone
- End with: "3D rendered cartoon, Pixar-style animation, cinematic lighting, vibrant saturated colors, high detail, smooth textures, 16:9 aspect ratio, children's animation quality"
- Vary camera angles between segments
${styleNotes ? `\nADDITIONAL STYLE NOTES: ${styleNotes}` : ""}

Respond ONLY with valid JSON (no markdown, no backticks, no extra text):
{
  "characters": [
    { "name": "Character Name", "description": "Full visual description..." }
  ],
  "segments": [
    { "segmentNumber": 1, "narrationText": "exact script text", "imagePrompt": "detailed prompt in English..." }
  ],
  "totalSegments": ${segmentCount},
  "estimatedDuration": "X minutes Y seconds"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Script:\n\n${script}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.4 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini text error:", err);
      return NextResponse.json({ error: "Gemini API error", detail: err }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();

    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("analyze-script error:", error);
    return NextResponse.json({ error: "Internal error", detail: String(error) }, { status: 500 });
  }
}
