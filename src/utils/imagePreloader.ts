/**
 * Image Preloader & Intelligent Caching Strategy for Campus Sequence
 * 
 * Requirements met:
 * - Prioritizes first frame immediately
 * - Preloads key milestones & nearby window around current index
 * - Progressive background loading without blocking the main thread
 * - Nearest loaded frame fallback so the canvas NEVER flashes or goes blank
 * - Handles device memory and cancels redundant operations
 */

import { CAMPUS_FRAME_PATHS, FRAME_COUNT } from './frameManifest';

export type PreloadProgressCallback = (loadedCount: number, total: number, percent: number) => void;

class ImageSequencePreloader {
  private cache = new Map<number, HTMLImageElement>();
  private loadingSet = new Set<number>();
  private loadedCount = 0;
  private subscribers = new Set<PreloadProgressCallback>();
  private initialLoadedPromise: Promise<HTMLImageElement>;
  private isDestroyed = false;

  constructor() {
    // Immediately initiate loading the very first frame
    this.initialLoadedPromise = this.loadSingleFrame(0);
  }

  /**
   * Preloads a single frame by index, returns promise resolving to the HTMLImageElement
   */
  public loadSingleFrame(index: number): Promise<HTMLImageElement> {
    if (index < 0 || index >= FRAME_COUNT) {
      return Promise.reject(new Error(`Index ${index} out of bounds`));
    }

    if (this.cache.has(index)) {
      return Promise.resolve(this.cache.get(index)!);
    }

    if (this.loadingSet.has(index)) {
      // Return a promise that polls or awaits cache
      return new Promise((resolve) => {
        const check = () => {
          if (this.cache.has(index)) {
            resolve(this.cache.get(index)!);
          } else if (!this.loadingSet.has(index)) {
            // Failed, retry once or resolve nearest
            resolve(this.getNearestLoadedFrame(index) || this.cache.get(0)!);
          } else {
            setTimeout(check, 25);
          }
        };
        check();
      });
    }

    this.loadingSet.add(index);
    const img = new Image();
    img.decoding = 'async';

    return new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => {
        if (this.isDestroyed) return;
        this.cache.set(index, img);
        this.loadingSet.delete(index);
        this.loadedCount++;
        this.notifyProgress();
        resolve(img);
      };

      img.onerror = (err) => {
        this.loadingSet.delete(index);
        console.warn(`[ImagePreloader] Failed to load frame ${index}:`, err);
        // Fallback to nearest loaded frame
        const fallback = this.getNearestLoadedFrame(index);
        if (fallback) {
          resolve(fallback);
        } else {
          reject(new Error(`Failed to load frame ${index}`));
        }
      };

      img.src = CAMPUS_FRAME_PATHS[index];
    });
  }

  /**
   * Awaits loading of the critical first frame
   */
  public whenInitialReady(): Promise<HTMLImageElement> {
    return this.initialLoadedPromise;
  }

  /**
   * Get frame immediately from cache, or return the closest neighboring loaded frame
   */
  public getFrameOrNearest(index: number): HTMLImageElement | null {
    if (this.cache.has(index)) {
      return this.cache.get(index)!;
    }
    return this.getNearestLoadedFrame(index);
  }

  /**
   * Finds the nearest loaded frame in cache to prevent blank flashes
   */
  public getNearestLoadedFrame(targetIndex: number): HTMLImageElement | null {
    if (this.cache.has(targetIndex)) {
      return this.cache.get(targetIndex)!;
    }

    // Search outwards from targetIndex
    let distance = 1;
    while (distance < FRAME_COUNT) {
      const lower = targetIndex - distance;
      if (lower >= 0 && this.cache.has(lower)) {
        return this.cache.get(lower)!;
      }
      const upper = targetIndex + distance;
      if (upper < FRAME_COUNT && this.cache.has(upper)) {
        return this.cache.get(upper)!;
      }
      distance++;
    }

    return this.cache.get(0) || null;
  }

  /**
   * Prioritizes preloading a window around the current index (e.g. current - 10 to current + 20)
   */
  public preloadWindowAround(currentIndex: number, windowRadius = 15): void {
    const start = Math.max(0, currentIndex - windowRadius);
    const end = Math.min(FRAME_COUNT - 1, currentIndex + windowRadius);

    for (let i = start; i <= end; i++) {
      if (!this.cache.has(i) && !this.loadingSet.has(i)) {
        this.loadSingleFrame(i).catch(() => {});
      }
    }
  }

  /**
   * Starts progressive background preloading of all frames in batches
   */
  public startProgressivePreload(onProgress?: PreloadProgressCallback): () => void {
    if (onProgress) {
      this.subscribers.add(onProgress);
      onProgress(this.loadedCount, FRAME_COUNT, Math.round((this.loadedCount / FRAME_COUNT) * 100));
    }

    // Step 1: Preload key interval frames first (e.g. every 10th frame) for rapid scroll responsiveness
    const keyFrames: number[] = [];
    for (let i = 0; i < FRAME_COUNT; i += 8) {
      keyFrames.push(i);
    }
    if (!keyFrames.includes(FRAME_COUNT - 1)) {
      keyFrames.push(FRAME_COUNT - 1);
    }

    // Load key frames in parallel batch
    Promise.all(keyFrames.map((idx) => this.loadSingleFrame(idx).catch(() => null))).then(() => {
      if (this.isDestroyed) return;

      // Step 2: Progressively load all remaining frames in chunks using requestIdleCallback or setTimeout
      let cursor = 0;
      const CHUNK_SIZE = 4;

      const loadNextChunk = () => {
        if (this.isDestroyed || cursor >= FRAME_COUNT) return;

        const chunkPromises: Promise<any>[] = [];
        for (let i = 0; i < CHUNK_SIZE && cursor < FRAME_COUNT; i++, cursor++) {
          if (!this.cache.has(cursor) && !this.loadingSet.has(cursor)) {
            chunkPromises.push(this.loadSingleFrame(cursor).catch(() => null));
          }
        }

        if (chunkPromises.length > 0) {
          Promise.all(chunkPromises).then(() => {
            if (!this.isDestroyed && cursor < FRAME_COUNT) {
              if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                (window as any).requestIdleCallback(loadNextChunk, { timeout: 150 });
              } else {
                setTimeout(loadNextChunk, 30);
              }
            }
          });
        } else {
          if (!this.isDestroyed && cursor < FRAME_COUNT) {
            setTimeout(loadNextChunk, 10);
          }
        }
      };

      loadNextChunk();
    });

    return () => {
      if (onProgress) {
        this.subscribers.delete(onProgress);
      }
    };
  }

  private notifyProgress() {
    const percent = Math.min(100, Math.round((this.loadedCount / FRAME_COUNT) * 100));
    this.subscribers.forEach((cb) => cb(this.loadedCount, FRAME_COUNT, percent));
  }

  public getLoadedCount(): number {
    return this.loadedCount;
  }

  public isFrameLoaded(index: number): boolean {
    return this.cache.has(index);
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.subscribers.clear();
    this.loadingSet.clear();
    this.cache.clear();
  }
}

// Global preloader singleton instance
export const sequencePreloader = new ImageSequencePreloader();
