/**
 * React Hook for GSAP ScrollTrigger Integration
 * Maps pinned container scrolling to normalized scroll progress [0.0, 1.0]
 */

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface UseScrollProgressOptions {
  triggerRef: React.RefObject<HTMLElement | null>;
  pinRef: React.RefObject<HTMLElement | null>;
  scrollDistance?: string | number; // e.g. "+=3500" or "+=400%"
  onProgress?: (progress: number, direction: number) => void;
  onComplete?: () => void;
}

export function useScrollProgress({
  triggerRef,
  pinRef,
  scrollDistance = '+=400%',
  onProgress,
  onComplete,
}: UseScrollProgressOptions) {
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = reverse
  const [isPinned, setIsPinned] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const triggerEl = triggerRef.current;
    const pinEl = pinRef.current;
    if (!triggerEl || !pinEl) return;

    // Create ScrollTrigger instance
    const st = ScrollTrigger.create({
      trigger: triggerEl,
      pin: pinEl,
      start: 'top top',
      end: scrollDistance,
      scrub: 0.15, // ultra-smooth interpolation without lag or sudden jumps
      anticipatePin: 1,
      onToggle: (self) => {
        setIsPinned(self.isActive);
      },
      onUpdate: (self) => {
        const p = self.progress;
        const dir = self.direction;
        setProgress(p);
        setDirection(dir);

        if (onProgress) {
          onProgress(p, dir);
        }

        if (p >= 0.99) {
          setIsCompleted(true);
          if (onComplete) onComplete();
        } else {
          setIsCompleted(false);
        }
      },
    });

    scrollTriggerRef.current = st;

    return () => {
      st.kill();
      scrollTriggerRef.current = null;
    };
  }, [triggerRef, pinRef, scrollDistance, onProgress, onComplete]);

  // Method to programmatically jump to progress
  const scrollToProgress = (targetProgress: number) => {
    if (!scrollTriggerRef.current) return;
    const st = scrollTriggerRef.current;
    const targetScroll = st.start + (st.end - st.start) * Math.max(0, Math.min(1, targetProgress));
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  return {
    progress,
    direction,
    isPinned,
    isCompleted,
    scrollToProgress,
    scrollTrigger: scrollTriggerRef.current,
  };
}
