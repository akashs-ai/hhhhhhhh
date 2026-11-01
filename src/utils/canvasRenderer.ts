/**
 * Canvas Renderer for Cinematic Image Sequence
 * 
 * Features:
 * - Precise aspect-ratio preservation (16:9) without distortion or stretching
 * - High-DPI (Retina) support capped at DPR 2 for optimal GPU performance
 * - Smooth "cover" fit centering the subject (student & architecture)
 * - requestAnimationFrame scheduling to prevent redundant redraws
 * - Opacity / blend support for smooth transition to the hero/login section
 */

import { FRAME_WIDTH, FRAME_HEIGHT } from './frameManifest';

export interface CanvasRenderOptions {
  dprCap?: number;
  opacity?: number;
}

export class CanvasSequenceRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastRenderedIndex = -1;
  private lastRenderedOpacity = 1;
  private rafId: number | null = null;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
    this.updateDimensions();
  }

  /**
   * Resizes the canvas buffer according to client dimensions and DPR
   */
  public updateDimensions(dprCap = 2): { width: number; height: number } {
    const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.dpr = Math.min(rawDpr, dprCap);

    const clientWidth = this.canvas.clientWidth || window.innerWidth;
    const clientHeight = this.canvas.clientHeight || window.innerHeight;

    const bufferWidth = Math.round(clientWidth * this.dpr);
    const bufferHeight = Math.round(clientHeight * this.dpr);

    if (this.canvas.width !== bufferWidth || this.canvas.height !== bufferHeight) {
      this.canvas.width = bufferWidth;
      this.canvas.height = bufferHeight;
      this.lastRenderedIndex = -1; // Force redraw on resize
    }

    return { width: clientWidth, height: clientHeight };
  }

  /**
   * Draws an image frame onto the canvas with "cover" composition
   */
  public drawFrame(
    image: HTMLImageElement | null,
    frameIndex: number,
    options: CanvasRenderOptions = {}
  ): void {
    if (!image || !image.complete || image.naturalWidth === 0) {
      return;
    }

    const targetOpacity = options.opacity !== undefined ? Math.max(0, Math.min(1, options.opacity)) : 1;

    // Skip redundant rendering if frame index and opacity match
    if (this.lastRenderedIndex === frameIndex && Math.abs(this.lastRenderedOpacity - targetOpacity) < 0.005) {
      return;
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.renderFrameImmediate(image, frameIndex, targetOpacity);
    });
  }

  /**
   * Immediate synchronous draw operation
   */
  public renderFrameImmediate(
    image: HTMLImageElement,
    frameIndex: number,
    opacity = 1
  ): void {
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    if (canvasW === 0 || canvasH === 0) return;

    const imgW = image.naturalWidth || FRAME_WIDTH;
    const imgH = image.naturalHeight || FRAME_HEIGHT;
    const imgAspect = imgW / imgH;
    const canvasAspect = canvasW / canvasH;

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    // "cover" math: fill entire viewport while preserving 16:9 aspect ratio and centering
    if (canvasAspect > imgAspect) {
      drawW = canvasW;
      drawH = canvasW / imgAspect;
      drawX = 0;
      drawY = (canvasH - drawH) / 2;
    } else {
      drawH = canvasH;
      drawW = canvasH * imgAspect;
      drawX = (canvasW - drawW) / 2;
      drawY = (canvasH - drawH) / 2;
    }

    this.ctx.clearRect(0, 0, canvasW, canvasH);

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.ctx.drawImage(image, drawX, drawY, drawW, drawH);
    this.ctx.restore();

    this.lastRenderedIndex = frameIndex;
    this.lastRenderedOpacity = opacity;
  }

  public clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lastRenderedIndex = -1;
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
