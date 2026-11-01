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
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-6 z-30 px-6 max-w-7xl mx-auto flex items-center justify-between ${className}`}>
      {/* Center: Scroll down indicator (visible in earlier frames) */}
      <div className="flex-1 flex items-center justify-center">
        {progress < 0.85 && (
          <div
            onClick={onScrollDown}
            className="pointer-events-auto flex items-center space-x-2 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 rounded-full px-5 py-2 text-[#f5ebd9] text-xs font-poppins font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <span>Scroll to walk campus</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-[#d8b568]" />
          </div>
        )}
      </div>

      {/* Right: Skip / Enter Portal Action */}
      <div className="pointer-events-auto flex items-center space-x-2.5">
        {onSkipToLogin && (
          <button
            type="button"
            onClick={onSkipToLogin}
            className="group px-4 py-2.5 rounded-2xl bg-[#283d31]/85 hover:bg-[#344f40] backdrop-blur-md border border-[#527762]/50 text-[#f5ebd9] text-xs font-poppins font-semibold tracking-wide shadow-lg hover:shadow-emerald-950/40 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <span>Skip to Portal</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#d8b568] group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
