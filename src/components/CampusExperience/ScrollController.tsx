/**
 * ScrollController Component
 * Floating controls, progress telemetry, and navigation actions.
 */

import React from 'react';
import { ChevronDown, ArrowRight, Play, Compass } from 'lucide-react';
import { progressToFrameIndex, FRAME_COUNT } from '../../utils/frameManifest';

export interface ScrollControllerProps {
  progress: number;
  direction: number;
  onSkipToLogin?: () => void;
  onScrollDown?: () => void;
  className?: string;
}

export const ScrollController: React.FC<ScrollControllerProps> = ({
  progress,
  direction,
  onSkipToLogin,
  onScrollDown,
  className = '',
}) => {
  const currentFrame = progressToFrameIndex(progress) + 1;
  const percent = Math.round(progress * 100);

  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-6 z-30 px-6 max-w-7xl mx-auto flex items-center justify-between ${className}`}>
      {/* Left: Frame & Progress Telemetry */}
      <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 text-[#ede4d3] shadow-lg flex items-center space-x-3 text-xs">
        <Compass className="w-4 h-4 text-[#d8b568] shrink-0" />
        <div className="flex items-center space-x-2 font-mono">
          <span className="font-bold text-[#faf3e7]">Frame {String(currentFrame).padStart(3, '0')}</span>
          <span className="text-white/30">/</span>
          <span className="text-white/60">{FRAME_COUNT}</span>
        </div>
        <div className="h-3 w-px bg-white/20" />
        <span className="text-[11px] font-sans font-semibold text-[#c8d4cc]">
          {percent}% Explored
        </span>
      </div>

      {/* Center: Scroll down indicator (visible in earlier frames) */}
      {progress < 0.85 && (
        <div
          onClick={onScrollDown}
          className="pointer-events-auto hidden md:flex items-center space-x-2 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-white/90 text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <span>Scroll to walk campus</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[#d8b568]" />
        </div>
      )}

      {/* Right: Skip / Enter Portal Action */}
      <div className="pointer-events-auto flex items-center space-x-2.5">
        {onSkipToLogin && (
          <button
            type="button"
            onClick={onSkipToLogin}
            className="group px-4 py-2.5 rounded-2xl bg-[#283d31]/80 hover:bg-[#344f40] backdrop-blur-md border border-[#527762]/50 text-[#f5ebd9] text-xs font-semibold tracking-wide shadow-lg hover:shadow-emerald-950/40 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <span>Skip to Portal</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#d8b568] group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
