/**
 * Frame Manifest for Cinematic Campus Sequence
 * 
 * Total Frames: 242
 * Resolution: 1920x1080 (16:9)
 * Format: JPEG
 * Chronological Order: ezgif-frame-001.jpg -> ezgif-frame-242.jpg
 */

export const FRAME_COUNT = 242;
export const FRAME_WIDTH = 1920;
export const FRAME_HEIGHT = 1080;
export const FRAME_ASPECT_RATIO = FRAME_WIDTH / FRAME_HEIGHT; // 16:9 (~1.7778)

/**
 * Generates an array of all frame URLs relative to public directory.
 */
export const CAMPUS_FRAME_PATHS: string[] = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const frameNumber = String(i + 1).padStart(3, '0');
  return `/assets/campus-sequence/ezgif-frame-${frameNumber}.jpg`;
});

/**
 * Returns the path for a given 0-indexed frame.
 */
export function getFramePath(index: number): string {
  const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
  return CAMPUS_FRAME_PATHS[clamped];
}

/**
 * Maps a normalized scroll progress (0.0 to 1.0) to a 0-indexed frame number.
 */
export function progressToFrameIndex(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return Math.round(clamped * (FRAME_COUNT - 1));
}

/**
 * Narrative milestones across the 242 frames
 */
export interface NarrativeMilestone {
  startProgress: number;
  endProgress: number;
  title: string;
  subtitle: string;
  phase: 'aerial' | 'descent' | 'follow' | 'greeting' | 'gate' | 'entry';
}

export const NARRATIVE_MILESTONES: NarrativeMilestone[] = [
  {
    startProgress: 0.0,
    endProgress: 0.18,
    title: 'Chilika Institute of Technology',
    subtitle: 'Where algorithmic precision meets academic excellence',
    phase: 'aerial',
  },
  {
    startProgress: 0.22,
    endProgress: 0.45,
    title: 'A Campus in Motion',
    subtitle: 'Dynamic timetables and conflict-free schedules powered by AI',
    phase: 'descent',
  },
  {
    startProgress: 0.48,
    endProgress: 0.70,
    title: 'Every Journey Synchronized',
    subtitle: 'Connecting faculty, departments, and students in real time',
    phase: 'follow',
  },
  {
    startProgress: 0.72,
    endProgress: 0.88,
    title: 'Welcome to CIT',
    subtitle: 'Your day, seamlessly scheduled',
    phase: 'greeting',
  },
  {
    startProgress: 0.90,
    endProgress: 1.0,
    title: 'Step Into the Portal',
    subtitle: 'Sign in to access your personalized campus dashboard',
    phase: 'gate',
  },
];
