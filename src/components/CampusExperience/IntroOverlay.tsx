/**
 * IntroOverlay Component
 * Displays the initial title card and brand presentation during the aerial campus overview.
 */

import React from 'react';
import { GraduationCap } from 'lucide-react';

export interface IntroOverlayProps {
  progress: number;
  className?: string;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ progress, className = '' }) => {
  // Fade out cleanly as camera starts descending (0.0 to 0.18)
  const opacity = Math.max(0, Math.min(1, (0.18 - progress) / 0.18));

  if (opacity <= 0.01) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center p-6 text-center ${className}`}
      style={{
        opacity,
        transform: `translateY(${progress * -40}px)`,
        transition: 'opacity 0.1s ease-out',
      }}
    >
      <div className="max-w-xl w-full space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[#eeddc3] text-xs font-serif tracking-widest uppercase">
          <GraduationCap className="w-4 h-4 text-[#d8b568]" />
          <span>Interactive Campus Journey</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black text-[#faf6ee] tracking-tight drop-shadow-xl">
          Chilika Institute of Technology
        </h1>

        <p className="text-xs sm:text-base text-[#e5d9c2] font-sans font-medium max-w-md mx-auto leading-relaxed drop-shadow-md">
          Scroll to descend into campus and explore our intelligent scheduling ecosystem.
        </p>
      </div>
    </div>
  );
};
