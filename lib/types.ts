export interface Character {
  name: string;
  description: string;
}

export interface Segment {
  segmentNumber: number;
  narrationText: string;
  imagePrompt: string;
}

export interface AnalysisResult {
  characters: Character[];
  segments: Segment[];
  totalSegments: number;
  estimatedDuration: string;
}

export interface GeneratedImage {
  segmentNumber: number;
  narrationText: string;
  imagePrompt: string;
  imageBase64: string | null;
  mimeType: string;
  status: "pending" | "generating" | "done" | "error";
  error?: string;
}

export interface StoryboardState {
  phase: "input" | "analyzing" | "generating" | "done";
  script: string;
  styleNotes: string;
  analysis: AnalysisResult | null;
  images: GeneratedImage[];
  currentGenerating: number;
}
