/**
 * CampusExperience Component
 * The main orchestrator for the scroll-controlled image sequence and 2.5D parallax journey.
 * 
 * Features:
 * - Full-screen pinned canvas powered by GSAP ScrollTrigger
 * - 242-frame sequential chronological rendering
 * - Bi-directional forward & reverse scrubbing
 * - Scroll-synchronized typography (aerial -> descent -> follow -> greeting -> gate)
 * - Seamless blend transition at the end (opacity -> 0) into the hero / login page
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { CampusCanvas } from './CampusCanvas';
import { ExperienceLoader } from './ExperienceLoader';
import { TextOverlay } from './TextOverlay';
import { IntroOverlay } from './IntroOverlay';
import { ScrollController } from './ScrollController';
import { LoginPanel } from './LoginPanel';
import { useImageSequence } from '../../hooks/useImageSequence';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import '../../styles/campus-experience.css';

export interface CampusExperienceProps {
  onReachHero?: () => void;
  onSkipToLogin?: () => void;
  onLoginSubmit?: (credentials: { identifier: string; pass: string }) => void;
  children?: React.ReactNode; // Content rendered immediately after the pinned scroll experience (e.g. Hero section)
}

export const CampusExperience: React.FC<CampusExperienceProps> = ({
  onReachHero,
  onSkipToLogin,
  onLoginSubmit,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinTargetRef = useRef<HTMLDivElement | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(1);
  const [showGateLogin, setShowGateLogin] = useState(false);

  // Hook 1: Image sequence preloading & frame retrieval
  const { isReady, preloadPercent, getFrame } = useImageSequence();

  // Scroll handler with requestAnimationFrame throttle
  const handleScrollProgress = useCallback((progress: number, direction: number) => {
    setCurrentProgress(progress);
    setScrollDirection(direction);

    // Toggle gate login panel when arriving near the campus gate (progress > 0.88)
    if (progress >= 0.88 && !showGateLogin) {
      setShowGateLogin(true);
    } else if (progress < 0.80 && showGateLogin) {
      setShowGateLogin(false);
    }
  }, [showGateLogin]);

  // Hook 2: GSAP ScrollTrigger binding to container & pinned stage
  const { scrollToProgress } = useScrollProgress({
    triggerRef: containerRef,
    pinRef: pinTargetRef,
    scrollDistance: '+=380%', // Deliberate, smooth scroll length (~4 viewports)
    onProgress: handleScrollProgress,
    onComplete: onReachHero,
  });

  // Calculate canvas blend opacity:
  // Starts at 1.0 throughout the journey; as progress advances from 0.88 to 1.0,
  // it smoothly blends down to 0 so the user transitions effortlessly into the hero section!
  const canvasBlendOpacity = useMemo(() => {
    if (currentProgress < 0.88) return 1.0;
    // Map 0.88 -> 1.0 to 1.0 -> 0.0
    const fadeLocal = (currentProgress - 0.88) / 0.12;
    return Math.max(0, Math.min(1, 1 - fadeLocal));
  }, [currentProgress]);

  const handleSkip = useCallback(() => {
    if (onSkipToLogin) {
      onSkipToLogin();
    } else {
      scrollToProgress(1.0);
    }
  }, [onSkipToLogin, scrollToProgress]);

  const handleScrollDown = useCallback(() => {
    scrollToProgress(0.25);
  }, [scrollToProgress]);

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
            pointerEvents: currentProgress >= 0.98 ? 'none' : 'auto',
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

          {/* Initial Title Overlay (Aerial View) */}
          <IntroOverlay progress={currentProgress} />

          {/* Scroll-Synchronized Narrative Typography */}
          <TextOverlay progress={currentProgress} />

          {/* Gate-Arrival Floating Login Panel (Appears near the Main Gate) */}
          {showGateLogin && currentProgress < 0.96 && (
            <div
              className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 z-30 transition-all duration-500 ease-out pointer-events-auto"
              style={{
                opacity: Math.min(1, (currentProgress - 0.85) / 0.08) * canvasBlendOpacity,
                transform: `translateY(-50%) translateX(${(1 - Math.min(1, (currentProgress - 0.85) / 0.08)) * 30}px)`,
              }}
            >
              <LoginPanel
                onLoginSubmit={onLoginSubmit}
                onSwitchToAdvanced={onSkipToLogin}
              />
            </div>
          )}

          {/* Telemetry & Scroll Controls */}
          <ScrollController
            progress={currentProgress}
            direction={scrollDirection}
            onSkipToLogin={handleSkip}
            onScrollDown={handleScrollDown}
          />
        </div>
      </div>

      {/* 2. Seamless Destination Page Section (Hero / Role Portal) */}
      {children && (
        <div
          id="hero-section"
          className="relative w-full z-40 bg-slate-50 transition-opacity duration-500"
        >
          {children}
        </div>
      )}
    </div>
  );
};
