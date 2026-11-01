/**
 * TextOverlay Component
 * Perfectly centered cinematic typography with smooth scroll-shift animation.
 * 
 * Features:
 * - Positioned at the EXACT dead center of the screen at progress 0
 * - Constrained to the middle corridor of the screen (never reaches screen edges)
 * - As scrolling starts (progress 0.0 -> 0.14), smoothly glides to top-center
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
  // Vertical shift: progress 0.0 -> 0.14 smoothly shifts from vertical center (50%) to top-center (12%)
  const shiftRatio = Math.max(0, Math.min(1, progress / 0.14));
  const topPercent = 50 - shiftRatio * 38; // 50% -> 12%
  const translateYPercent = -50 + shiftRatio * 50; // -50% -> 0%

  // Active milestone detection & smooth opacity curve
  const activeMilestone = useMemo(() => {
    // Phase 1: Aerial CIT title (from start 0.0 up to 0.22)
    if (progress <= 0.22) {
      const milestone = customMilestones[0];
      let opacity = 1;
      if (progress > 0.18) {
        opacity = Math.max(0, (0.22 - progress) / 0.04);
      }
      return {
        ...milestone,
        opacity,
      };
    }

    // Phases 2 to 5: Subsequent narrative milestones at top-center
    for (let i = 1; i < customMilestones.length; i++) {
      const milestone = customMilestones[i];
      if (progress >= milestone.startProgress && progress <= milestone.endProgress) {
        const span = milestone.endProgress - milestone.startProgress;
        const local = (progress - milestone.startProgress) / span;

        // Smooth bell curve
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

  return (
    <div className={`absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-start overflow-hidden ${className}`}>
      {/* Centered content box strictly bounded to middle of screen */}
      <div
        className="w-full max-w-lg sm:max-w-xl md:max-w-2xl px-6 text-center select-none"
        style={{
          position: 'absolute',
          top: `${topPercent}%`,
          transform: `translateY(${translateYPercent}%)`,
          opacity: activeMilestone.opacity,
          transition: 'opacity 0.2s ease-out, top 0.08s linear, transform 0.08s linear',
          willChange: 'top, transform, opacity',
        }}
      >
        <div className="space-y-2">
          {/* Main Heading in TEKO (Uppercase, Condensed, Centered) */}
          <h1 className="font-teko font-bold uppercase tracking-wider text-[#faf6ee] leading-[0.95] text-4xl sm:text-5xl md:text-6xl lg:text-7xl cinematic-text-shadow text-center mx-auto">
            {activeMilestone.title}
          </h1>

          {/* Subtitle in POPPINS (Clean, Elegant, Centered) */}
          <p className="font-poppins font-medium text-xs sm:text-sm md:text-base text-[#e5d9c2] max-w-md mx-auto leading-relaxed tracking-wide cinematic-sub-shadow text-center">
            {activeMilestone.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};
