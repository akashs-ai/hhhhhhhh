/**
 * CampusExperience Component
 * Full-screen scroll-controlled cinematic campus sequence.
 * 
 * Features:
 * - Direct, buttery-smooth 120fps lerp scrubbing (wheel, touch, trackpad, keyboard)
 * - 242-frame sequential chronological rendering
 * - Text starts at the exact dead center of the screen, glides to top-center on scroll
 * - At the end of the parallax sequence (frame 242), triggers a cinematic fade-out
 *   transition and seamlessly navigates to the Hero page!
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CampusCanvas } from './CampusCanvas';
import { ExperienceLoader } from './ExperienceLoader';
import { TextOverlay } from './TextOverlay';
import { ScrollController } from './ScrollController';
import { useImageSequence } from '../../hooks/useImageSequence';
import '../../styles/campus-experience.css';

export interface CampusExperienceProps {
  onReachHero: () => void;
  onSkipToLogin?: () => void;
  onLoginSubmit?: (credentials: { identifier: string; pass: string }) => void;
}

export const CampusExperience: React.FC<CampusExperienceProps> = ({
  onReachHero,
  onSkipToLogin,
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const hasTriggeredCompleteRef = useRef(false);

  // Hook: Image sequence preloading & frame retrieval
  const { isReady, preloadPercent, getFrame } = useImageSequence();

  // Handles completion and fade-out transition to the Hero page
  const handleSequenceComplete = useCallback(() => {
    if (hasTriggeredCompleteRef.current) return;
    hasTriggeredCompleteRef.current = true;
    setIsFadingOut(true);

    // Smooth cinematic fade-out duration before switching to the hero page
    setTimeout(() => {
      onReachHero();
    }, 500);
  }, [onReachHero]);

  const handleSkip = useCallback(() => {
    if (onSkipToLogin) {
      onSkipToLogin();
    } else {
      handleSequenceComplete();
    }
  }, [onSkipToLogin, handleSequenceComplete]);

  const handleScrollDown = useCallback(() => {
    targetProgressRef.current = Math.min(1.0, targetProgressRef.current + 0.22);
  }, []);

  // Butter-smooth 120fps lerp loop with wheel, touch, and keyboard support
  useEffect(() => {
    let animId: number;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (hasTriggeredCompleteRef.current) return;

      // Normalize wheel delta for trackpads vs mouse wheels
      const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 60);
      const sensitivity = 0.0009;
      const nextTarget = Math.max(0, Math.min(1.0, targetProgressRef.current + delta * sensitivity));

      setScrollDirection(delta >= 0 ? 1 : -1);
      targetProgressRef.current = nextTarget;
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (hasTriggeredCompleteRef.current) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;

      const sensitivity = 0.0022;
      const nextTarget = Math.max(0, Math.min(1.0, targetProgressRef.current + deltaY * sensitivity));

      setScrollDirection(deltaY >= 0 ? 1 : -1);
      targetProgressRef.current = nextTarget;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (hasTriggeredCompleteRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setScrollDirection(1);
        targetProgressRef.current = Math.min(1.0, targetProgressRef.current + 0.08);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setScrollDirection(-1);
        targetProgressRef.current = Math.max(0.0, targetProgressRef.current - 0.08);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    // Smooth animation tick
    const tick = () => {
      const current = currentProgressRef.current;
      const target = targetProgressRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.0004) {
        const next = current + diff * 0.15; // Smooth damping
        currentProgressRef.current = next;
        setCurrentProgress(next);

        // When the animation completes its 242 frames at the campus gate
        if (next >= 0.97 && !hasTriggeredCompleteRef.current) {
          handleSequenceComplete();
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleSequenceComplete]);

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 overflow-hidden bg-[#121915] select-none">
      {/* 1. Main Full-screen Canvas */}
      <CampusCanvas
        progress={currentProgress}
        getFrame={getFrame}
        opacity={1.0}
      />

      {/* 2. Hand-painted Vignette & Morning Mist Overlays */}
      <div className="campus-canvas-vignette" />
      <div className="campus-atmosphere-mist" />

      {/* 3. Initial Loading Screen */}
      <ExperienceLoader
        isReady={isReady}
        progressPercent={preloadPercent}
        onEnterNow={() => {
          targetProgressRef.current = 0.05;
        }}
      />

      {/* 4. Scroll-Synchronized Typography (Starts center, glides top-center) */}
      <TextOverlay progress={currentProgress} />

      {/* 5. Bottom Controls (Scroll to explore + Skip to Portal) */}
      <ScrollController
        progress={currentProgress}
        direction={scrollDirection}
        onSkipToLogin={handleSkip}
        onScrollDown={handleScrollDown}
      />

      {/* 6. Cinematic Fade-out Overlay (Transitions to the Hero Page at sequence end) */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none bg-[#121915] transition-opacity duration-500 ease-in-out ${
          isFadingOut ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
