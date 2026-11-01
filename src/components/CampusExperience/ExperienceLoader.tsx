/**
 * ExperienceLoader Component
 * Elegant, minimalist loading indicator matching the campus art direction.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

export interface ExperienceLoaderProps {
  progressPercent: number;
  isReady: boolean;
  onEnterNow?: () => void;
}

export const ExperienceLoader: React.FC<ExperienceLoaderProps> = ({
  progressPercent,
  isReady,
  onEnterNow,
}) => {
  if (isReady && progressPercent >= 10) {
    return null; // Initial frame ready to display
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#16201b] text-[#f4ecd8] flex flex-col items-center justify-center p-6 transition-opacity duration-700 pointer-events-auto">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* Campus Emblem */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#2d4237] border border-[#446353] flex items-center justify-center text-[#e8d5b5] shadow-lg shadow-black/40">
            <Sparkles className="w-8 h-8 text-[#d8b568] animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl font-teko font-bold uppercase tracking-wide text-[#f7f0e3] leading-none">
            Chilika Institute of Technology
          </h2>
          <p className="text-xs text-[#a9b8ad] font-poppins tracking-wider uppercase">
            Preparing Cinematic Campus Experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2 font-poppins">
          <div className="w-full h-1.5 rounded-full bg-[#27382f] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8ba389] via-[#d8b568] to-[#e4c275] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.max(8, progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#8e9f93] font-mono">
            <span>Synchronizing sequence...</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        {isReady && onEnterNow && (
          <button
            onClick={onEnterNow}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#2d4237] hover:bg-[#385345] text-[#f4ecd8] border border-[#496b59] text-xs font-poppins font-semibold tracking-wide transition-all shadow-md cursor-pointer"
          >
            Enter Campus
          </button>
        )}
      </div>
    </div>
  );
};
