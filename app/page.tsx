"use client";

import { useState, useRef } from "react";
import type { AnalysisResult, GeneratedImage } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────────
function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function estimateDuration(words: number) {
  const seconds = Math.round(words / 2.5);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `~${m}m ${s}s` : `~${s}s`;
}
function estimateSegments(words: number) {
  return Math.max(1, Math.ceil((words / 2.5) / 5));
}

// ── sub-components ───────────────────────────────────────────────────────────
function Badge({ children, color = "cyan" }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    cyan:   "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    amber:  "bg-amber-500/10 text-amber-400 border-amber-500/30",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    green:  "bg-green-500/10 text-green-400 border-green-500/30",
    rose:   "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold ${map[color] ?? map.cyan}`}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
  );
}

function ImageCard({
  img,
  index,
  onRetry,
  onClick,
}: {
  img: GeneratedImage;
  index: number;
  onRetry: (img: GeneratedImage) => void;
  onClick: (img: GeneratedImage) => void;
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-slate-700/60 bg-slate-800/40 backdrop-blur transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 fade-in">
      {/* scene number */}
      <div className="absolute top-2 left-2 z-10">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/30">
          {img.segmentNumber}
        </span>
      </div>

      {/* image area */}
      <div
        className={`aspect-video w-full flex items-center justify-center bg-slate-900/60 ${img.status === "done" ? "cursor-pointer" : ""}`}
        onClick={() => img.status === "done" && onClick(img)}
      >
        {img.status === "done" && (
          <img
            src={`data:${img.mimeType};base64,${img.imageBase64}`}
            alt={`Scene ${img.segmentNumber}`}
            className="w-full h-full object-cover"
          />
        )}
        {img.status === "generating" && (
          <div className="flex flex-col items-center gap-2">
            <Spinner />
            <span className="text-xs text-slate-500 font-mono">generating…</span>
          </div>
        )}
        {img.status === "pending" && (
          <div className="flex flex-col items-center gap-1.5 opacity-30">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-slate-600 font-mono">pending</span>
          </div>
        )}
        {img.status === "error" && (
          <div className="flex flex-col items-center gap-2 text-rose-400 px-4 text-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-mono">error</span>
            <button
              onClick={() => onRetry(img)}
              className="text-xs px-2 py-0.5 rounded border border-rose-500/40 hover:bg-rose-500/10 transition-colors"
            >
              retry
            </button>
          </div>
        )}
      </div>

      {/* narration */}
      {img.narrationText && (
        <div className="px-3 py-2 border-t border-slate-700/40">
          <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-2">
            {img.narrationText}
          </p>
        </div>
      )}
    </div>
  );
}

function Lightbox({ img, onClose }: { img: GeneratedImage | null; onClose: () => void }) {
  if (!img) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute -top-9 right-0 text-slate-400 hover:text-white font-mono text-xs flex items-center gap-1"
          onClick={onClose}
        >
          ✕ close
        </button>
        <div className="rounded-xl overflow-hidden border border-slate-700">
          <img
            src={`data:${img.mimeType};base64,${img.imageBase64}`}
            alt={`Scene ${img.segmentNumber}`}
            className="w-full"
          />
        </div>
        <div className="mt-3 px-1 space-y-1">
          <Badge color="cyan">SCENE {img.segmentNumber}</Badge>
          <p className="text-sm text-slate-400 font-mono">{img.narrationText}</p>
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [phase, setPhase] = useState<"input" | "analyzing" | "generating" | "done">("input");
  const [script, setScript] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [lightbox, setLightbox] = useState<GeneratedImage | null>(null);
  const abortRef = useRef(false);

  const wordCount = countWords(script);
  const segmentCount = estimateSegments(wordCount);

  // ── generate single image ──────────────────────────────────────────────────
  async function generateImage(prompt: string, segmentNumber: number): Promise<{ imageBase64: string; mimeType: string } | null> {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, segmentNumber }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return { imageBase64: data.imageBase64, mimeType: data.mimeType };
  }

  // ── main flow ──────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!script.trim()) return;
    abortRef.current = false;
    setPhase("analyzing");
    setStatusMsg("Analyzing script…");
    setImages([]);
    setDoneCount(0);
    setAnalysis(null);

    // Step 1: analyze
    let result: AnalysisResult;
    try {
      const res = await fetch("/api/analyze-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, styleNotes }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      result = data;
      setAnalysis(result);
    } catch (e) {
      setStatusMsg(`Error: ${String(e)}`);
      setPhase("input");
      return;
    }

    if (abortRef.current) { setPhase("input"); return; }

    // Step 2: init image list
    const initImages: GeneratedImage[] = result.segments.map((seg) => ({
      segmentNumber: seg.segmentNumber,
      narrationText: seg.narrationText,
      imagePrompt: seg.imagePrompt,
      imageBase64: null,
      mimeType: "image/png",
      status: "pending",
    }));
    setImages(initImages);
    setPhase("generating");

    let done = 0;

    // Step 3: generate images sequentially
    for (let i = 0; i < result.segments.length; i++) {
      if (abortRef.current) break;

      const seg = result.segments[i];
      setStatusMsg(`Generating scene ${i + 1} of ${result.segments.length}…`);

      setImages((prev) =>
        prev.map((img, idx) => (idx === i ? { ...img, status: "generating" } : img))
      );

      const imgResult = await generateImage(seg.imagePrompt, seg.segmentNumber);

      if (imgResult) {
        done++;
        setDoneCount(done);
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i
              ? { ...img, imageBase64: imgResult.imageBase64, mimeType: imgResult.mimeType, status: "done" }
              : img
          )
        );
      } else {
        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, status: "error" } : img))
        );
      }

      // 1s delay between requests (rate limiting)
      if (i < result.segments.length - 1 && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (!abortRef.current) {
      setPhase("done");
      setStatusMsg("Done!");
    } else {
      setPhase("done");
    }
  }

  // ── retry single image ─────────────────────────────────────────────────────
  async function handleRetry(img: GeneratedImage) {
    setImages((prev) =>
      prev.map((i) => (i.segmentNumber === img.segmentNumber ? { ...i, status: "generating" } : i))
    );
    const result = await generateImage(img.imagePrompt, img.segmentNumber);
    setImages((prev) =>
      prev.map((i) =>
        i.segmentNumber === img.segmentNumber
          ? result
            ? { ...i, imageBase64: result.imageBase64, mimeType: result.mimeType, status: "done" }
            : { ...i, status: "error" }
          : i
      )
    );
  }

  // ── download zip ───────────────────────────────────────────────────────────
  async function handleDownload() {
    const doneImages = images.filter((i) => i.status === "done");
    const res = await fetch("/api/download-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: doneImages }),
    });
    if (!res.ok) { alert("Error generating ZIP"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storyboard.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    abortRef.current = true;
    setPhase("input");
    setScript("");
    setStyleNotes("");
    setAnalysis(null);
    setImages([]);
    setDoneCount(0);
    setStatusMsg("");
  }

  const totalCount = images.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#070810] text-slate-200 font-mono"
      style={{
        backgroundImage: `radial-gradient(ellipse at 20% 20%, rgba(6,182,212,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.04) 0%, transparent 50%)`,
      }}
    >
      {/* ── header ── */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-40 bg-[#070810]/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-slate-200 tracking-wide">STORYBOARD GENERATOR</span>
        </div>
        <div className="flex items-center gap-2">
          {phase !== "input" && (
            <Badge color={phase === "done" ? "green" : "cyan"}>
              {phase === "analyzing" ? "ANALYZING" : phase === "generating" ? `${doneCount}/${totalCount}` : `✓ ${doneCount} scenes`}
            </Badge>
          )}
          {(phase === "done" || phase === "generating") && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded border border-slate-700/50 hover:border-slate-600"
            >
              ↺ New
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* ── INPUT ── */}
        {phase === "input" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-white">Script → Storyboard</h1>
              <p className="text-sm text-slate-500">Paste your narration script. AI segments it and generates one image per scene.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase tracking-widest">Script</label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your narration script here…"
                rows={10}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none transition-colors"
              />
              {wordCount > 0 && (
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <Badge color="cyan">{wordCount} words</Badge>
                  <Badge color="amber">{estimateDuration(wordCount)}</Badge>
                  <Badge color="violet">{segmentCount} scenes</Badge>
                  <span className="text-xs text-slate-600">≈ ${(segmentCount * 0.039).toFixed(2)} USD</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase tracking-widest">
                Visual Style Notes <span className="text-slate-700">(optional)</span>
              </label>
              <input
                value={styleNotes}
                onChange={(e) => setStyleNotes(e.target.value)}
                placeholder="e.g. noir atmosphere, watercolor style, futuristic city…"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!script.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 text-white text-sm font-bold tracking-wide hover:from-cyan-500 hover:to-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-cyan-500/10"
            >
              Generate Storyboard →
            </button>
          </div>
        )}

        {/* ── ANALYZING / GENERATING ── */}
        {(phase === "analyzing" || phase === "generating") && (
          <div className="space-y-6">
            <div className="max-w-lg mx-auto space-y-4">
              <p className="text-sm text-slate-400 text-center">{statusMsg}</p>

              {phase === "generating" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-cyan-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {phase === "analyzing" && (
                <div className="flex justify-center">
                  <Spinner />
                </div>
              )}

              <button
                onClick={() => { abortRef.current = true; }}
                className="w-full py-2 text-xs text-slate-500 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/30 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <ImageCard key={img.segmentNumber} img={img} index={i} onRetry={handleRetry} onClick={setLightbox} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DONE ── */}
        {phase === "done" && (
          <div className="space-y-6">
            {/* top bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge color="green">✓ {doneCount} scenes</Badge>
                {analysis && <Badge color="amber">{analysis.estimatedDuration}</Badge>}
                {(analysis?.characters?.length ?? 0) > 0 && (
                  <Badge color="cyan">{analysis!.characters.length} characters</Badge>
                )}
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/10 transition-all"
              >
                ↓ Download ZIP ({doneCount} images)
              </button>
            </div>

            {/* characters */}
            {(analysis?.characters?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Characters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis!.characters.map((char, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-1 rounded-full bg-gradient-to-b from-cyan-500 to-violet-500 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">{char.name}</p>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{char.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <ImageCard key={img.segmentNumber} img={img} index={i} onRetry={handleRetry} onClick={setLightbox} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Lightbox img={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
