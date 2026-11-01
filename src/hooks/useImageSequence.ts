/**
 * React Hook for managing Image Sequence Preloading & Current Frame Access
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sequencePreloader, PreloadProgressCallback } from '../utils/imagePreloader';
import { FRAME_COUNT } from '../utils/frameManifest';

export function useImageSequence() {
  const [isReady, setIsReady] = useState(false);
  const [preloadPercent, setPreloadPercent] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const lastIndexRef = useRef<number>(0);

  useEffect(() => {
    // 1. Initial critical frame check
    sequencePreloader.whenInitialReady().then(() => {
      setIsReady(true);
    });

    // 2. Progressive background preloader
    const handleProgress: PreloadProgressCallback = (loaded, total, percent) => {
      setLoadedCount(loaded);
      setPreloadPercent(percent);
    };

    const cleanup = sequencePreloader.startProgressivePreload(handleProgress);

    return () => {
      cleanup();
    };
  }, []);

  const getFrame = useCallback((index: number): HTMLImageElement | null => {
    lastIndexRef.current = index;
    // Preload nearby window
    sequencePreloader.preloadWindowAround(index, 20);
    return sequencePreloader.getFrameOrNearest(index);
  }, []);

  return {
    isReady,
    preloadPercent,
    loadedCount,
    totalFrames: FRAME_COUNT,
    getFrame,
  };
}
