/**
 * TextOverlay Component
 * Renders scroll-synchronized typography mapped across the continuous 242-frame journey.
 * 
 * Phases:
 * 1. Aerial View: CIT introduction [progress 0.0 - 0.20]
 * 2. Descent: Architectural & AI Solver narrative [0.25 - 0.45]
 * 3. Follow Camera: Walk through campus road [0.48 - 0.70]
 * 4. Greeting: Near entrance welcome [0.72 - 0.88]
 * 5. Main Gate: Final approach & transition [0.89 - 1.0]
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
  // Find currently active milestone and compute smooth fadeIn/fadeOut curve
  const activeMilestone = useMemo(() => {
    for (const milestone of customMilestones) {
      if (progress >= milestone.startProgress && progress <= milestone.endProgress) {
        const span = milestone.endProgress - milestone.startProgress;
        const local = (progress - milestone.startProgress) / span; // 0 to 1

        // Smooth Bell curve: fade in first 20%, sustain middle 60%, fade out last 20%
        let opacity = 1;
        if (local < 0.2) {
          opacity = local / 0.2;
        } else if (local > 0.8) {
          opacity = (1 - local) / 0.2;
        }

        // Parallax translateY effect
        const translateY = (local - 0.5) * -16; // subtle float upward

        return {
          ...milestone,
          opacity: Math.max(0, Math.min(1, opacity)),
          translateY,
        };
      }
    }
    return null;
  }, [progress, customMilestones]);

  if (!activeMilestone || activeMilestone.opacity <= 0.01) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex flex-col justify-end sm:justify-center items-center pb-24 sm:pb-0 px-6 z-20 ${className}`}
      style={{
        opacity: activeMilestone.opacity,
        transform: `translateY(${activeMilestone.translateY}px)`,
        transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
      }}
    >
      <div className="max-w-2xl w-full text-center space-y-3.5 bg-black/35 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#354f41]/60 border border-[#8ea998]/30 text-[#e9decb] text-xs font-serif tracking-widest uppercase">
          <span>Phase {activeMilestone.phase}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-black text-[#faf6ee] tracking-tight drop-shadow-md">
          {activeMilestone.title}
        </h1>

        <p className="text-xs sm:text-base text-[#e5d9c2] font-sans font-medium max-w-lg mx-auto leading-relaxed drop-shadow-sm">
          {activeMilestone.subtitle}
        </p>
      </div>
    </div>
  );
};
