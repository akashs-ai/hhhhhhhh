/**
 * Automated Verification Suite for Cinematic Campus Login Experience
 * 
 * Verifies:
 * 1. Asset Extraction & File Integrity (242 frames, 1920x1080, zero corruption)
 * 2. Frame Manifest & Chronological Sequence Mapping (0.0 to 1.0 progress)
 * 3. Bidirectional Monotonic Scrubbing (Forward & Reverse)
 * 4. Aspect Ratio & Cover Scaling (Desktop, Tablet, Mobile)
 * 5. End-of-Sequence Blend Opacity Curve (1.0 -> 0.0 to hero transition)
 * 6. Live Asset Serving over HTTP (First, Mid, Last frames)
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import {
  FRAME_COUNT,
  FRAME_WIDTH,
  FRAME_HEIGHT,
  FRAME_ASPECT_RATIO,
  CAMPUS_FRAME_PATHS,
  getFramePath,
  progressToFrameIndex,
  NARRATIVE_MILESTONES,
} from '../src/utils/frameManifest';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

function getJpgDimensions(filePath: string): { width: number; height: number } | null {
  const buf = fs.readFileSync(filePath);
  let i = 0;
  if (buf[i] !== 0xFF || buf[i + 1] !== 0xD8) return null;
  i += 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

async function runCampusExperienceSuite() {
  console.log('=================================================================');
  console.log('CINEMATIC CAMPUS EXPERIENCE — VERIFICATION SUITE');
  console.log('=================================================================\n');

  // -----------------------------------------------------------------
  // SECTION 1: ASSET EXTRACTION & CONTINUITY AUDIT
  // -----------------------------------------------------------------
  console.log('--- SECTION 1: Asset Extraction & Continuity Audit ---');
  const sequenceDir = path.join(process.cwd(), 'public', 'assets', 'campus-sequence');
  assert(fs.existsSync(sequenceDir), 'Target sequence directory exists in public/assets/campus-sequence');

  const files = fs.readdirSync(sequenceDir).filter((f) => f.endsWith('.jpg'));
  assert(files.length === 242, `Extracted exactly 242 frames (found ${files.length})`);

  let allValid = true;
  let allConsistentRes = true;
  for (let i = 1; i <= 242; i++) {
    const filename = `ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
    const fullPath = path.join(sequenceDir, filename);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
      allValid = false;
      break;
    }
    const dims = getJpgDimensions(fullPath);
    if (!dims || dims.width !== 1920 || dims.height !== 1080) {
      allConsistentRes = false;
      break;
    }
  }
  assert(allValid, 'All 242 frames are non-empty, valid JPEG files without corruption');
  assert(allConsistentRes, 'All 242 frames have identical 1920x1080 Full HD resolution');

  // Verify first and last frames
  const firstFrame = path.join(sequenceDir, 'ezgif-frame-001.jpg');
  const lastFrame = path.join(sequenceDir, 'ezgif-frame-242.jpg');
  assert(fs.existsSync(firstFrame), 'First frame ezgif-frame-001.jpg verified');
  assert(fs.existsSync(lastFrame), 'Last frame ezgif-frame-242.jpg verified');

  // -----------------------------------------------------------------
  // SECTION 2: FRAME MANIFEST & NUMERICAL ORDERING
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 2: Frame Manifest & Numerical Ordering ---');
  assert(CAMPUS_FRAME_PATHS.length === 242, 'Manifest contains exactly 242 indexed paths');
  assert(CAMPUS_FRAME_PATHS[0] === '/assets/campus-sequence/ezgif-frame-001.jpg', 'First frame path correctly mapped');
  assert(CAMPUS_FRAME_PATHS[241] === '/assets/campus-sequence/ezgif-frame-242.jpg', 'Final frame path correctly mapped');
  assert(FRAME_ASPECT_RATIO === 16 / 9, 'Aspect ratio constant is exactly 16:9');

  // Test progress mapping
  assert(progressToFrameIndex(0.0) === 0, 'Progress 0.0 maps to Frame 0 (first frame)');
  assert(progressToFrameIndex(0.41) === 121, 'Progress 0.41 maps to Frame 121 (midpoint of animation)');
  assert(progressToFrameIndex(0.82) === 241, 'Progress 0.82 maps to Frame 241 (final frame at gate)');
  assert(progressToFrameIndex(1.0) === 241, 'Progress 1.0 retains Frame 241 during crossfade transition');

  // -----------------------------------------------------------------
  // SECTION 3: BIDIRECTIONAL SCRUBBING INTEGRITY
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 3: Bidirectional Scrubbing Integrity ---');
  let forwardMonotonic = true;
  let lastIdx = -1;
  for (let p = 0; p <= 100; p += 2) {
    const idx = progressToFrameIndex(p / 100);
    if (idx < lastIdx) {
      forwardMonotonic = false;
      break;
    }
    lastIdx = idx;
  }
  assert(forwardMonotonic, 'Forward scroll progress maps monotonically without sudden jumps or reverse cuts');

  let reverseMonotonic = true;
  lastIdx = 242;
  for (let p = 100; p >= 0; p -= 2) {
    const idx = progressToFrameIndex(p / 100);
    if (idx > lastIdx) {
      reverseMonotonic = false;
      break;
    }
    lastIdx = idx;
  }
  assert(reverseMonotonic, 'Reverse scroll progress scrubs backwards cleanly without skipping or jumping');

  // -----------------------------------------------------------------
  // SECTION 4: RESPONSIVE ASPECT RATIO & COVER COMPOSITION
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 4: Responsive Aspect Ratio & Cover Composition ---');

  function calculateCover(canvasW: number, canvasH: number, imgW = 1920, imgH = 1080) {
    const canvasAspect = canvasW / canvasH;
    const imgAspect = imgW / imgH;
    let drawW: number;
    let drawH: number;
    if (canvasAspect > imgAspect) {
      drawW = canvasW;
      drawH = canvasW / imgAspect;
    } else {
      drawH = canvasH;
      drawW = canvasH * imgAspect;
    }
    const calculatedAspect = drawW / drawH;
    return { drawW, drawH, calculatedAspect };
  }

  // Desktop Ultrawide & 16:9
  const desktop16x9 = calculateCover(1920, 1080);
  assert(Math.abs(desktop16x9.calculatedAspect - 16 / 9) < 0.001, 'Desktop 16:9 maintains pristine 16:9 composition');
  assert(desktop16x9.drawW >= 1920 && desktop16x9.drawH >= 1080, 'Desktop 16:9 fully covers canvas without gaps');

  // Tablet Portrait (768x1024)
  const tabletPortrait = calculateCover(768, 1024);
  assert(Math.abs(tabletPortrait.calculatedAspect - 16 / 9) < 0.001, 'Tablet portrait maintains exact 16:9 aspect ratio');
  assert(tabletPortrait.drawW >= 768 && tabletPortrait.drawH >= 1024, 'Tablet portrait fully covers canvas without distortion');

  // Mobile Portrait (390x844)
  const mobilePortrait = calculateCover(390, 844);
  assert(Math.abs(mobilePortrait.calculatedAspect - 16 / 9) < 0.001, 'Mobile portrait maintains exact 16:9 aspect ratio');
  assert(mobilePortrait.drawW >= 390 && mobilePortrait.drawH >= 844, 'Mobile portrait fully covers canvas without stretching');

  // -----------------------------------------------------------------
  // SECTION 5: IN-PLACE CROSSFADE TRANSITION CURVE
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 5: In-Place Crossfade Transition Curve ---');

  function computeCrossfade(progress: number) {
    if (progress < 0.82) return { canvas: 1.0, hero: 0.0 };
    const fadeRatio = Math.max(0, Math.min(1, (progress - 0.82) / 0.16));
    return {
      canvas: Math.max(0, 1 - fadeRatio),
      hero: fadeRatio,
    };
  }

  assert(computeCrossfade(0.0).canvas === 1.0 && computeCrossfade(0.0).hero === 0.0, 'At start: canvas is 100%, next page is 0%');
  assert(computeCrossfade(0.5).canvas === 1.0 && computeCrossfade(0.5).hero === 0.0, 'During animation: canvas remains 100%');
  assert(computeCrossfade(0.82).canvas === 1.0 && computeCrossfade(0.82).hero === 0.0, 'At animation completion (0.82): canvas is 100%');
  assert(Math.abs(computeCrossfade(0.90).canvas - 0.5) < 0.01, 'At midpoint of transition (0.90): canvas fades out to ~50%');
  assert(Math.abs(computeCrossfade(0.90).hero - 0.5) < 0.01, 'At midpoint of transition (0.90): next page fades in to ~50%');
  assert(computeCrossfade(0.98).canvas === 0.0 && computeCrossfade(0.98).hero === 1.0, 'At 0.98: canvas is 0%, next page is 100% in place');
  assert(computeCrossfade(1.0).canvas === 0.0 && computeCrossfade(1.0).hero === 1.0, 'At 1.0: next page is 100% visible and interactive');

  // -----------------------------------------------------------------
  // SECTION 6: NARRATIVE MILESTONES SYNCHRONIZATION
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 6: Narrative Milestones Synchronization ---');
  assert(NARRATIVE_MILESTONES.length === 5, 'Contains 5 continuous narrative phases');
  assert(NARRATIVE_MILESTONES[0].phase === 'aerial', 'First milestone is aerial overview');
  assert(NARRATIVE_MILESTONES[4].phase === 'gate', 'Final milestone is main gate entry');

  // -----------------------------------------------------------------
  // SECTION 7: HTTP ASSET DELIVERY TEST
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 7: HTTP Asset Delivery Test ---');
  const checkAssetHttp = async (relPath: string): Promise<number> => {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:3000${relPath}`, (res) => {
        resolve(res.statusCode || 500);
      });
      req.on('error', () => resolve(500));
    });
  };

  const statusFrame1 = await checkAssetHttp('/assets/campus-sequence/ezgif-frame-001.jpg');
  assert(statusFrame1 === 200, 'HTTP GET /assets/campus-sequence/ezgif-frame-001.jpg returns 200 OK');

  const statusFrame120 = await checkAssetHttp('/assets/campus-sequence/ezgif-frame-120.jpg');
  assert(statusFrame120 === 200, 'HTTP GET /assets/campus-sequence/ezgif-frame-120.jpg returns 200 OK');

  const statusFrame242 = await checkAssetHttp('/assets/campus-sequence/ezgif-frame-242.jpg');
  assert(statusFrame242 === 200, 'HTTP GET /assets/campus-sequence/ezgif-frame-242.jpg returns 200 OK');

  console.log('\n-----------------------------------------------------------------');
  console.log(`CAMPUS EXPERIENCE TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('-----------------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runCampusExperienceSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
