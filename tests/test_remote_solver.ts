import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { ROOT_DIR, DATASET_PATH } from '../server/config.js';
import { PythonBridge } from '../server/pythonBridge.js';

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

async function run() {
  console.log('=================================================================');
  console.log('PYTHON SOLVER MICROSERVICE & REMOTE BRIDGE VERIFICATION');
  console.log('=================================================================\n');

  const testPort = 9876;
  const testSecret = 'cit-solver-secret-test-2026';
  const solverScript = path.join(ROOT_DIR, 'solver_service.py');

  let serviceProcess: ChildProcess | null = null;

  try {
    // 1. Start solver_service.py in a background process
    console.log(`--- Starting solver_service.py on port ${testPort} ---`);
    serviceProcess = spawn('python', [solverScript], {
      env: {
        ...process.env,
        PORT: String(testPort),
        SOLVER_API_SECRET: testSecret,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Wait for the service to be ready
    let isReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${testPort}/health`);
        if (res.ok) {
          isReady = true;
          break;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 200));
    }

    assert(isReady, 'Solver microservice started and responded to /health');

    // Configure PythonBridge to point to the remote service
    process.env.SOLVER_SERVICE_URL = `http://127.0.0.1:${testPort}`;
    process.env.SOLVER_API_SECRET = testSecret;

    // 2. Test environment check via bridge
    console.log('\n--- Section 1: Bridge Health & Environment Check ---');
    const envStatus = await PythonBridge.checkEnvironment();
    assert(envStatus.pythonAvailable, 'Python available via remote solver');
    assert(envStatus.solverAvailable, 'Solver reported available');
    assert(envStatus.validatorAvailable, 'Validator reported available');

    // 3. Test unauthorized request rejection (bad secret)
    console.log('\n--- Section 2: Authentication & Security ---');
    let authFailed = false;
    try {
      const unauthRes = await fetch(`http://127.0.0.1:${testPort}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token-xyz',
        },
        body: JSON.stringify({ data: { sessions: [] } }),
      });
      if (unauthRes.status === 401) {
        authFailed = true;
      }
    } catch (_) {}
    assert(authFailed, 'Unauthorized requests without valid bearer token rejected with HTTP 401');

    // 4. Test remote schedule solve via PythonBridge
    console.log('\n--- Section 3: Remote Timetable Solving via PythonBridge ---');
    const solveResult = await PythonBridge.runSolver(DATASET_PATH, {
      seed: 42,
      teamName: 'CIT Production Solver Test',
    });

    assert(solveResult !== null, 'Solver returned a valid result object');
    assert(Array.isArray(solveResult.baselineSchedule?.sessions), 'Baseline schedule contains sessions array');
    assert(solveResult.baselineSchedule.sessions.length === 189, 'Baseline schedule contains all 189 teaching sessions');
    assert(solveResult.baselineReport?.hard_violation_count === 0, 'Official validator confirms 0 hard violations on generated schedule');
    assert(solveResult.executionTimeMs > 0, `Solver execution time recorded (${solveResult.executionTimeMs}ms)`);

    // 5. Test remote schedule validation via PythonBridge
    console.log('\n--- Section 4: Remote Schedule Validation via PythonBridge ---');
    const scheduleExportPath = path.join(ROOT_DIR, 'exports', 'schedule.json');
    const validationReport = await PythonBridge.validateSchedule(DATASET_PATH, scheduleExportPath);

    assert(validationReport !== null, 'Validator returned a report object');
    assert(validationReport.hard_violation_count === 0, 'Sample baseline validation confirms 0 hard violations');
    assert(typeof validationReport.soft_total === 'number', 'Validation report contains numeric soft penalty score');

  } finally {
    // Clean up environment and process
    delete process.env.SOLVER_SERVICE_URL;
    delete process.env.SOLVER_API_SECRET;

    if (serviceProcess) {
      serviceProcess.kill();
    }
  }

  console.log(`\n=================================================================`);
  console.log(`REMOTE SOLVER TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=================================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Remote solver test suite failed with error:', err);
  process.exit(1);
});
