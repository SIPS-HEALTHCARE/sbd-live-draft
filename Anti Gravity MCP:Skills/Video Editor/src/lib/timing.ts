export const VIDEO_FPS = 30;
export const CAPTION_SWITCH_MS = 1500;

// Derived from last caption's endMs in sips-video.json
export const VIDEO_DURATION_MS = 111140;
export const TOTAL_FRAMES = Math.ceil((VIDEO_DURATION_MS / 1000) * VIDEO_FPS); // 3335

// Section breakpoints
// Intro:  0 – 5s
// Body:   5s – ~100.14s
// Outro:  last ~11s (~100.14s – 111.14s)
export const SECTIONS = {
  intro: { startFrame: 0, endFrame: 150, startMs: 0, endMs: 5000 },
  body: { startFrame: 150, endFrame: 3005, startMs: 5000, endMs: 100140 },
  outro: { startFrame: 3005, endFrame: TOTAL_FRAMES, startMs: 100140, endMs: VIDEO_DURATION_MS },
} as const;

// Photo schedule: which photos appear when with what transition
export const PHOTO_SCHEDULE: Array<{
  photoIndex: number;
  startFrame: number;
  durationFrames: number;
  transition: "slide" | "fade" | "zoom" | "wipe";
  kenBurns: "in" | "out";
}> = [
  // Body section: 12 photos, ~225 frames apart starting at frame 300
  { photoIndex: 0, startFrame: 300, durationFrames: 90, transition: "fade", kenBurns: "in" },
  { photoIndex: 5, startFrame: 525, durationFrames: 90, transition: "slide", kenBurns: "out" },
  { photoIndex: 10, startFrame: 750, durationFrames: 90, transition: "zoom", kenBurns: "in" },
  { photoIndex: 15, startFrame: 975, durationFrames: 90, transition: "wipe", kenBurns: "out" },
  { photoIndex: 20, startFrame: 1200, durationFrames: 90, transition: "fade", kenBurns: "in" },
  { photoIndex: 25, startFrame: 1425, durationFrames: 90, transition: "slide", kenBurns: "out" },
  { photoIndex: 30, startFrame: 1650, durationFrames: 90, transition: "zoom", kenBurns: "in" },
  { photoIndex: 35, startFrame: 1875, durationFrames: 90, transition: "wipe", kenBurns: "out" },
  { photoIndex: 40, startFrame: 2100, durationFrames: 90, transition: "fade", kenBurns: "in" },
  { photoIndex: 45, startFrame: 2325, durationFrames: 90, transition: "slide", kenBurns: "out" },
  { photoIndex: 50, startFrame: 2550, durationFrames: 90, transition: "zoom", kenBurns: "in" },
  { photoIndex: 55, startFrame: 2775, durationFrames: 90, transition: "wipe", kenBurns: "out" },
  // Outro section: 8 photos, rapid 30-frame each
  { photoIndex: 2, startFrame: 3010, durationFrames: 35, transition: "fade", kenBurns: "in" },
  { photoIndex: 8, startFrame: 3050, durationFrames: 35, transition: "slide", kenBurns: "out" },
  { photoIndex: 14, startFrame: 3090, durationFrames: 35, transition: "zoom", kenBurns: "in" },
  { photoIndex: 22, startFrame: 3130, durationFrames: 35, transition: "wipe", kenBurns: "out" },
  { photoIndex: 28, startFrame: 3170, durationFrames: 35, transition: "fade", kenBurns: "in" },
  { photoIndex: 34, startFrame: 3210, durationFrames: 35, transition: "slide", kenBurns: "out" },
  { photoIndex: 42, startFrame: 3250, durationFrames: 35, transition: "zoom", kenBurns: "in" },
  { photoIndex: 48, startFrame: 3290, durationFrames: 35, transition: "wipe", kenBurns: "out" },
];

// Light leak timing: triggered at photo transitions for dramatic effect
export const LIGHT_LEAK_SCHEDULE: Array<{
  triggerFrame: number;
  durationFrames: number;
}> = [
  { triggerFrame: 295, durationFrames: 30 },   // First photo entrance
  { triggerFrame: 970, durationFrames: 30 },   // Quarter through body
  { triggerFrame: 1870, durationFrames: 30 },  // Midpoint
  { triggerFrame: 2770, durationFrames: 30 },  // Three-quarter body
  { triggerFrame: 3000, durationFrames: 45 },  // Outro entrance (longer)
];

// Vignette intensity keyframes
export const VIGNETTE_KEYFRAMES: Array<{ frame: number; intensity: number }> = [
  { frame: 0, intensity: 0.8 },      // Tight vignette on intro
  { frame: 150, intensity: 0.5 },    // Relax for body
  { frame: 3005, intensity: 0.7 },   // Tighten for outro
  { frame: 3335, intensity: 0.9 },   // Maximum at end
];

// Lower third appearances
export const LOWER_THIRD_SCHEDULE: Array<{
  startFrame: number;
  durationFrames: number;
  title: string;
  subtitle?: string;
}> = [
  { startFrame: 30, durationFrames: 120, title: "SPD911", subtitle: "SIPS Healthcare Solutions" },
  { startFrame: 3050, durationFrames: 240, title: "CONTENT WITHOUT CONTEXT", subtitle: "IS A CATASTROPHE" },
];
