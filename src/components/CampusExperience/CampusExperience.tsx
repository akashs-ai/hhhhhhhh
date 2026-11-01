/**
 * CampusExperience Component
 * The main orchestrator for the scroll-controlled image sequence and 2.5D parallax journey.
 * 
 * Features:
 * - Full-screen pinned canvas powered by GSAP ScrollTrigger
 * - 242-frame sequential chronological rendering (0.0 -> 0.82)
 * - Bi-directional forward & reverse scrubbing
 * - Perfectly centered typography that glides to top-center as scrolling begins
 * - In-place crossfade transition: animated frames fade out, next page fades in
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { CampusCanvas } from './CampusCanvas';
import { ExperienceLoader } from './ExperienceLoader';
import { TextOverlay } from './TextOverlay';
import { ScrollController } from './ScrollController';
import { LoginPanel } from './LoginPanel';
import { useImageSequence } from '../../hooks/useImageSequence';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { ANIMATION_END_PROGRESS } from '../../utils/frameManifest';
import '../../styles/campus-experience.css';

export interface CampusExperienceProps {
  onReachHero?: () => void;
  onSkipToLogin?: () => void;
  onLoginSubmit?: (credentials: { identifier: string; pass: string }) => void;
  children?: React.ReactNode; // Content rendered when transitioning to the next page (e.g. Hero section)
}

export const CampusExperience: React.FC<CampusExperienceProps> = ({
  onReachHero,
  onSkipToLogin,
  onLoginSubmit,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinTargetRef = useRef<HTMLDivElement | null>(null);
  const heroScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(1);
  const [showGateLogin, setShowGateLogin] = useState(false);

  // Hook 1: Image sequence preloading & frame retrieval
  const { isReady, preloadPercent, getFrame } = useImageSequence();

  // Scroll handler with requestAnimationFrame throttle
  const handleScrollProgress = useCallback((progress: number, direction: number) => {
    setCurrentProgress(progress);
    setScrollDirection(direction);

    // Toggle gate login panel when arriving near the campus gate (progress 0.74 to 0.82)
    if (progress >= 0.74 && progress <= 0.84 && !showGateLogin) {
      setShowGateLogin(true);
    } else if ((progress < 0.70 || progress > 0.85) && showGateLogin) {
      setShowGateLogin(false);
    }
  }, [showGateLogin]);

  // Hook 2: GSAP ScrollTrigger binding to container & pinned stage
  const { scrollToProgress } = useScrollProgress({
    triggerRef: containerRef,
    pinRef: pinTargetRef,
    scrollDistance: '+=350%', // Smooth, deliberate scroll length
    onProgress: handleScrollProgress,
    onComplete: onReachHero,
  });

  // Calculate in-place crossfade opacity:
  // 1. From 0.0 to ANIMATION_END_PROGRESS (0.82): canvas sequence is 100% visible, hero is 0% visible.
  // 2. From 0.82 to 1.0: animated frames FADE OUT (1 -> 0), next page FADES IN (0 -> 1) right in place!
  const { canvasBlendOpacity, heroFadeOpacity } = useMemo(() => {
    if (currentProgress < ANIMATION_END_PROGRESS) {
      return { canvasBlendOpacity: 1.0, heroFadeOpacity: 0.0 };
    }
    // Fade range: 0.82 -> 0.98
    const fadeRatio = Math.max(0, Math.min(1, (currentProgress - ANIMATION_END_PROGRESS) / (0.98 - ANIMATION_END_PROGRESS)));
    return {
      canvasBlendOpacity: Math.max(0, 1 - fadeRatio),
      heroFadeOpacity: fadeRatio,
    };
  }, [currentProgress]);

  const handleSkip = useCallback(() => {
    if (onSkipToLogin) {
      onSkipToLogin();
    } else {
      scrollToProgress(1.0);
    }
  }, [onSkipToLogin, scrollToProgress]);

  const handleScrollDown = useCallback(() => {
    scrollToProgress(0.20);
  }, [scrollToProgress]);

  // Handle scrolling up when user is inside the hero page at the top
  const handleHeroWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = heroScrollContainerRef.current;
    if (!el) return;

    // If at top of the hero page and user scrolls UP, rewind into the campus experience
    if (el.scrollTop <= 0 && e.deltaY < 0) {
      scrollToProgress(0.80);
    }
  };

  return (
    <div className="relative w-full">
      {/* 1. Cinematic Scroll Container with GSAP Pinning */}
      <div
        ref={containerRef}
        className="campus-sequence-container w-full"
      >
        {/* Pinned Viewport Stage */}
        <div
          ref={pinTargetRef}
          className="campus-canvas-stage relative w-full h-screen overflow-hidden"
          style={{
            backgroundColor: currentProgress >= 0.95 ? '#f8fafc' : '#121915',
            transition: 'background-color 0.2s ease-out',
          }}
        >
          {/* Main Full-screen Canvas */}
          <CampusCanvas
            progress={currentProgress}
            getFrame={getFrame}
            opacity={canvasBlendOpacity}
          />

          {/* Vignette & Morning Mist Overlays */}
          <div
            className="campus-canvas-vignette"
            style={{ opacity: canvasBlendOpacity }}
          />
          <div
            className="campus-atmosphere-mist"
            style={{ opacity: canvasBlendOpacity }}
          />

          {/* Initial Loading Screen */}
          <ExperienceLoader
            isReady={isReady}
            progressPercent={preloadPercent}
            onEnterNow={() => scrollToProgress(0.05)}
          />

          {/* Scroll-Synchronized Narrative Typography (Starts center, shifts top-center) */}
          <TextOverlay
            progress={currentProgress}
            className={canvasBlendOpacity <= 0.05 ? 'opacity-0' : ''}
          />

          {/* Gate-Arrival Floating Login Panel (Appears near the Main Gate) */}
          {showGateLogin && currentProgress < 0.84 && (
            <div
              className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 z-30 transition-all duration-500 ease-out pointer-events-auto"
              style={{
                opacity: Math.min(1, (currentProgress - 0.74) / 0.06) * canvasBlendOpacity,
                transform: `translateY(-50%) translateX(${(1 - Math.min(1, (currentProgress - 0.74) / 0.06)) * 30}px)`,
              }}
            >
              <LoginPanel
                onLoginSubmit={onLoginSubmit}
                onSwitchToAdvanced={onSkipToLogin}
              />
            </div>
          )}

          {/* Bottom Telemetry & Scroll Controls */}
          {canvasBlendOpacity > 0.05 && (
            <ScrollController
              progress={currentProgress}
              direction={scrollDirection}
              onSkipToLogin={handleSkip}
              onScrollDown={handleScrollDown}
            />
          )}

          {/* 2. Destination Next Page (Hero / Role Portal) — Cross-Fades In-Place */}
          {children && (
            <div
              ref={heroScrollContainerRef}
              onWheel={handleHeroWheel}
              className="absolute inset-0 w-full h-full z-40 bg-slate-50 overflow-y-auto"
              style={{
                opacity: heroFadeOpacity,
                pointerEvents: currentProgress >= 0.92 ? 'auto' : 'none',
                transition: 'opacity 0.15s ease-out',
                visibility: heroFadeOpacity > 0.01 ? 'visible' : 'hidden',
              }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
