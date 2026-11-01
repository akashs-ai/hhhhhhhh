/**
 * CampusCanvas Component
 * Renders the full-screen canvas synchronizing the 242-frame sequential animation.
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { CanvasSequenceRenderer } from '../../utils/canvasRenderer';
import { progressToFrameIndex, FRAME_COUNT } from '../../utils/frameManifest';

export interface CampusCanvasProps {
  progress: number; // 0.0 to 1.0
  getFrame: (index: number) => HTMLImageElement | null;
  opacity?: number; // 1.0 down to 0.0 for smooth blending at the end
  className?: string;
}

export interface CampusCanvasHandle {
  renderCurrent: () => void;
  getCanvasElement: () => HTMLCanvasElement | null;
}

export const CampusCanvas = forwardRef<CampusCanvasHandle, CampusCanvasProps>(
  ({ progress, getFrame, opacity = 1.0, className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<CanvasSequenceRenderer | null>(null);
    const lastFrameIndexRef = useRef<number>(-1);

    // Expose imperative handle for manual triggers if needed
    useImperativeHandle(ref, () => ({
      renderCurrent: () => {
        if (!rendererRef.current) return;
        const frameIndex = progressToFrameIndex(progress);
        const img = getFrame(frameIndex);
        if (img) {
          rendererRef.current.renderFrameImmediate(img, frameIndex, opacity);
        }
      },
      getCanvasElement: () => canvasRef.current,
    }));

    // Initialize renderer on mount
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = new CanvasSequenceRenderer(canvas);
      rendererRef.current = renderer;

      // Initial frame render
      const initialFrame = getFrame(0);
      if (initialFrame) {
        renderer.renderFrameImmediate(initialFrame, 0, opacity);
      }

      // Handle window resize with debounce
      const handleResize = () => {
        if (!rendererRef.current) return;
        rendererRef.current.updateDimensions();
        const currentIdx = progressToFrameIndex(progress);
        const img = getFrame(currentIdx);
        if (img) {
          rendererRef.current.renderFrameImmediate(img, currentIdx, opacity);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.destroy();
        rendererRef.current = null;
      };
    }, []);

    // Synchronize frame drawing with progress & opacity updates
    useEffect(() => {
      if (!rendererRef.current) return;

      const frameIndex = progressToFrameIndex(progress);
      const img = getFrame(frameIndex);

      if (img) {
        rendererRef.current.drawFrame(img, frameIndex, { opacity });
        lastFrameIndexRef.current = frameIndex;
      }
    }, [progress, opacity, getFrame]);

    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover block pointer-events-none select-none"
          style={{
            opacity,
            transition: 'opacity 0.15s ease-out',
          }}
        />
      </div>
    );
  }
);

CampusCanvas.displayName = 'CampusCanvas';
