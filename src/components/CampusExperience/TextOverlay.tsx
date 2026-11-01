/**
 * TextOverlay Component
 * Scroll-synchronized cinematic typography.
 * 
 * Features:
 * - Starts at the exact center of the screen at progress 0
 * - As scrolling starts (progress 0.0 -> 0.12), smoothly shifts to the top center
 * - Zero black blurry background boxes or pill badges (clean, direct overlay)
 * - Typography: TEKO for Headings & POPPINS for subtitles and small points
 * - High-contrast cinematic drop shadows for pristine readability over canvas
 */

import React, { useMemo } from 'react';
import { NARRATIVE_MILESTONES, NarrativeMilestone } from '../../utils/frameManifest';

export interface TextOverlayProps {
  progress: number; // 0.0 to 1.0
  customMilestones?: NarrativeMilestone[];
  className?: string;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  progress,
  customMilestones = NARRATIVE_MILESTONES,
  className = '',
}) => {
  // 1. Shift interpolation: progress 0.0 -> 0.12 transitions from center (50%) to top-center (12%)
  const shiftRatio = Math.max(0, Math.min(1, progress / 0.12));
  const topPercent = 50 - shiftRatio * 38; // 50% down to 12%
  const translateYPercent = -50 + shiftRatio * 50; // -50% to 0%

  // 2. Active milestone detection & smooth opacity curve
  const activeMilestone = useMemo(() => {
    // If progress is at the very beginning (0 to 0.20), guarantee aerial milestone is active
    if (progress <= 0.20) {
      const milestone = customMilestones[0];
      // Fade out as camera completes descent (0.16 to 0.22)
      let opacity = 1;
      if (progress > 0.16) {
        opacity = Math.max(0, (0.22 - progress) / 0.06);
      }
      return {
        ...milestone,
        opacity,
      };
    }

    // For later milestones (descent, follow, greeting, gate)
    for (let i = 1; i < customMilestones.length; i++) {
      const milestone = customMilestones[i];
      if (progress >= milestone.startProgress && progress <= milestone.endProgress) {
        const span = milestone.endProgress - milestone.startProgress;
        const local = (progress - milestone.startProgress) / span;

        // Smooth bell curve: fade in first 18%, hold middle 64%, fade out last 18%
        let opacity = 1;
        if (local < 0.18) {
          opacity = local / 0.18;
        } else if (local > 0.82) {
          opacity = (1 - local) / 0.18;
        }

        return {
          ...milestone,
          opacity: Math.max(0, Math.min(1, opacity)),
        };
      }
    }
    return null;
  }, [progress, customMilestones]);

  if (!activeMilestone || activeMilestone.opacity <= 0.01) {
    return null;
  }

  // Responsive font size scales: larger when in center, slightly more compact when at top-center
  const headingSizeClass =
    shiftRatio < 0.5
      ? 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl'
      : 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl';

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 pointer-events-none z-20 w-full max-w-4xl px-6 text-center ${className}`}
      style={{
        top: `${topPercent}%`,
        transform: `translate(-50%, ${translateYPercent}%)`,
        opacity: activeMilestone.opacity,
        transition: 'opacity 0.15s ease-out, top 0.05s linear, transform 0.05s linear',
        willChange: 'top, transform, opacity',
      }}
    >
      <div className="space-y-1 sm:space-y-2">
        {/* Main Heading in TEKO Font (Uppercase, Condensed, Majestic) */}
        <h1
          className={`font-teko font-bold uppercase tracking-wider text-[#faf6ee] leading-none cinematic-text-shadow ${headingSizeClass}`}
        >
          {activeMilestone.title}
        </h1>

        {/* Subtitle in POPPINS Font (Clean, Modern, Legible) */}
        <p
          className="font-poppins font-medium text-xs sm:text-sm md:text-base text-[#e5d9c2] max-w-xl mx-auto leading-relaxed tracking-wide cinematic-sub-shadow"
        >
          {activeMilestone.subtitle}
        </p>
      </div>
    </div>
  );
};
