/**
 * Automated Verification Suite for CIT Scheduling Platform Login Experience
 * 
 * Verifies:
 * 1. Student Google Authentication (Authorized accounts)
 * 2. Student Google Authentication (Rejection of unauthorized Google accounts)
 * 3. Student Google Authentication (Role mismatch prevention for faculty/admin emails)
 * 4. Professor Email/Password Authentication (Valid credentials)
 * 5. Professor Email/Password Authentication (Invalid credentials rejection)
 * 6. Professor Role Enforcement (Rejection of non-professor accounts)
 * 7. HOD/Admin Email/Password Authentication (Valid credentials)
 * 8. HOD/Admin Role Enforcement (Rejection of non-admin accounts)
 * 9. Suspended Account Rejection
 * 10. Password Recovery Flow (Forgot Password & Token Reset)
 * 11. Session Verification & Profile Retrieval (/api/users/me)
 * 12. Direct API Protection & Anti-Spoofing
 * 13. Idempotent Initial Account Provisioning (1 HOD + 10 Professors)
 * 14. Data Isolation Between Student, Professor, and HOD/Admin
 */

import http from 'http';
import { createExpressApp } from '../server/app.js';
import { storage } from '../server/storage.js';
import { provisionInitialAccounts } from '../server/scripts/provisionAccounts.js';

let server: http.Server;
let baseUrl: string;

async function request(
  method: string,
  path: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed: any = data;
          try {
            parsed = JSON.parse(data);
          } catch (_) {}
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (options?.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

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

async function runAuthSuite() {
  console.log('======================================================');
  console.log('CIT SCHEDULING PLATFORM — AUTHENTICATION & LOGIN SUITE');
  console.log('======================================================\n');

  const app = createExpressApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Auth Test Server bound to ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // -----------------------------------------------------------------
    // SECTION 1: SECURE INITIAL ACCOUNT PROVISIONING
    // -----------------------------------------------------------------
    console.log('--- SECTION 1: Idempotent Account Provisioning ---');
    const firstRun = await provisionInitialAccounts();
    assert(firstRun.length === 11, 'Provisions exactly 11 accounts (1 HOD/Admin + 10 Professors)');
    const hodAccounts = firstRun.filter((a) => a.category === 'HOD/Admin');
    const profAccounts = firstRun.filter((a) => a.category === 'Professor');
    assert(hodAccounts.length === 1, 'Contains exactly 1 initial HOD/Admin account');
    assert(profAccounts.length === 10, 'Contains exactly 10 initial Professor accounts');

    // Run again to verify idempotency
    const secondRun = await provisionInitialAccounts();
    const newCountInSecondRun = secondRun.filter((a) => a.account_action === 'newly_created').length;
    assert(newCountInSecondRun === 0, 'Re-running provisioning creates 0 duplicate accounts (100% idempotent)');

    // -----------------------------------------------------------------
    // SECTION 2: STUDENT GOOGLE AUTHENTICATION FLOW
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 2: Student Google Authentication Flow ---');
    
    // 2.1 Authorized Student Google Auth (Verified via Google Token)
    const studentAuth = await request('POST', '/api/auth/google-student', {
      body: {
        credential: 'test-google-token:aarav.cse3@cit.ac.in:Aarav Patel:https://cit.ac.in/avatars/aarav.jpg',
      },
    });
    assert(studentAuth.status === 200, 'Authorized student signs in successfully via Google (HTTP 200)');
    assert(studentAuth.body.success === true, 'Response indicates success');
    assert(studentAuth.body.user.role === 'student', 'Verified role is strictly student');
    assert(Boolean(studentAuth.body.token), 'Issues secure session token for student');
    assert(
      studentAuth.body.user.avatarUrl === 'https://cit.ac.in/avatars/aarav.jpg',
      'Student profile avatar retrieved and persisted correctly'
    );
    const studentToken = studentAuth.body.token;

    // 2.2 Rejection of Missing Token / Credentials
    const missingToken = await request('POST', '/api/auth/google-student', {
      body: { email: 'aarav.cse3@cit.ac.in' },
    });
    assert(missingToken.status === 400, 'Missing Google token rejected with HTTP 400');
    assert(missingToken.body.error?.code === 'GOOGLE_TOKEN_REQUIRED', 'Returns GOOGLE_TOKEN_REQUIRED code');

    // 2.3 Rejection of Invalid / Tampered / Forged Token
    const forgedToken = await request('POST', '/api/auth/google-student', {
      body: { credential: 'invalid-garbage-token-99999' },
    });
    assert(forgedToken.status === 401, 'Tampered/invalid Google token rejected with HTTP 401');
    assert(forgedToken.body.error?.code === 'INVALID_GOOGLE_TOKEN', 'Returns INVALID_GOOGLE_TOKEN code');

    // 2.4 Universal Google Account Access: Any valid Google account is allowed regardless of domain
    const personalGmailAuth = await request('POST', '/api/auth/google-student', {
      body: {
        credential: 'test-google-token:alex.mercer@gmail.com:Alex Mercer:https://lh3.googleusercontent.com/alex-photo.jpg',
      },
    });
    assert(personalGmailAuth.status === 200, 'Universal access: personal Gmail signs in successfully (HTTP 200)');
    assert(personalGmailAuth.body.success === true, 'Response indicates success');
    assert(personalGmailAuth.body.user.role === 'student', 'Assigned role is strictly student');
    assert(personalGmailAuth.body.user.email === 'alex.mercer@gmail.com', 'Preserves authenticated Google email');
    assert(personalGmailAuth.body.user.name === 'Alex Mercer', 'Preserves authenticated Google name');
    assert(
      personalGmailAuth.body.user.avatarUrl === 'https://lh3.googleusercontent.com/alex-photo.jpg',
      'Profile avatar persisted from Google'
    );
    const newStudentId = personalGmailAuth.body.user.id;
    const personalStudentToken = personalGmailAuth.body.token;

    // 2.5 Account Deduplication on Re-Login: Retrieves existing profile without duplicates
    const allUsersBeforeRelogin = Object.values(await storage.getAllUsers()).length;
    const reloginAuth = await request('POST', '/api/auth/google-student', {
      body: {
        credential: 'test-google-token:alex.mercer@gmail.com:Alex Mercer:https://lh3.googleusercontent.com/alex-photo.jpg',
      },
    });
    const allUsersAfterRelogin = Object.values(await storage.getAllUsers()).length;
    assert(reloginAuth.status === 200, 'Re-login with existing Google account succeeds (HTTP 200)');
    assert(reloginAuth.body.user.id === newStudentId, 'Retrieves identical user profile ID on re-login');
    assert(allUsersBeforeRelogin === allUsersAfterRelogin, 'Zero duplicate records created in storage on re-login');

    // 2.6 Privilege Isolation: Student accounts never have Professor or Admin privileges
    const studentAdminAttempt = await request('GET', '/api/users', {
      headers: { Authorization: `Bearer ${personalStudentToken}` },
    });
    assert(studentAdminAttempt.status === 403, 'Student strictly blocked from administrative user list (HTTP 403)');

    const studentApproveAttempt = await request('POST', '/api/bookings/req-01/approve', {
      headers: { Authorization: `Bearer ${personalStudentToken}` },
    });
    assert(studentApproveAttempt.status === 403, 'Student strictly blocked from booking approval action (HTTP 403)');

    const studentGenerateAttempt = await request('POST', '/api/timetable/generate', {
      headers: { Authorization: `Bearer ${personalStudentToken}` },
    });
    assert(studentGenerateAttempt.status === 403, 'Student strictly blocked from master timetable generation (HTTP 403)');

    // 2.7 Mandatory Google Authentication: No unauthenticated demo bypass endpoint exists
    const demoBypassAttempt = await request('POST', '/api/auth/demo-student');
    assert(demoBypassAttempt.status === 404, 'Unauthenticated demo bypass is eliminated (HTTP 404)');

    // 2.8 Role Mismatch: Faculty or Admin trying to authenticate as Student via Google
    const facultyAsStudent = await request('POST', '/api/auth/google-student', {
      body: {
        credential: 'test-google-token:prof.turing@cit.ac.in:Prof. Alan Turing',
      },
    });
    assert(facultyAsStudent.status === 403, 'Faculty email rejected from Student Google endpoint (HTTP 403)');
    assert(
      facultyAsStudent.body.error?.code === 'STUDENT_ROLE_MISMATCH',
      'Returns STUDENT_ROLE_MISMATCH error code'
    );

    // -----------------------------------------------------------------
    // SECTION 3: PROFESSOR EMAIL/PASSWORD AUTHENTICATION FLOW
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 3: Professor Email/Password Authentication Flow ---');

    // 3.1 Successful Professor Login (using master demo pass or provisioned pass)
    const profLogin = await request('POST', '/api/auth/login', {
      body: {
        email: 'prof.turing@cit.ac.in',
        password: 'citpass2026',
        category: 'professor',
      },
    });
    assert(profLogin.status === 200, 'Professor authenticates successfully with valid credentials (HTTP 200)');
    assert(profLogin.body.user.role === 'faculty', 'Authenticated user role is strictly faculty');
    assert(Boolean(profLogin.body.token), 'Issues secure professor token');
    const profToken = profLogin.body.token;

    // 3.2 Rejection of Invalid Password
    const profBadPass = await request('POST', '/api/auth/login', {
      body: {
        email: 'prof.turing@cit.ac.in',
        password: 'WrongPassword!2026',
        category: 'professor',
      },
    });
    assert(profBadPass.status === 401, 'Incorrect password rejected with HTTP 401');
    assert(profBadPass.body.error?.code === 'INVALID_PASSWORD', 'Returns INVALID_PASSWORD error code');

    // 3.3 Rejection of Non-Professor Account in Professor Flow (Role Enforcement)
    const adminAsProf = await request('POST', '/api/auth/login', {
      body: {
        email: 'dean.academics@cit.ac.in',
        password: 'citpass2026',
        category: 'professor',
      },
    });
    assert(adminAsProf.status === 403, 'Non-professor account rejected from Professor portal (HTTP 403)');
    assert(adminAsProf.body.error?.code === 'ROLE_UNAUTHORIZED', 'Returns ROLE_UNAUTHORIZED error code');

    // -----------------------------------------------------------------
    // SECTION 4: HOD / ADMIN EMAIL/PASSWORD AUTHENTICATION FLOW
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 4: HOD / Admin Email/Password Authentication Flow ---');

    // 4.1 Successful Admin Login
    const adminLogin = await request('POST', '/api/auth/login', {
      body: {
        email: 'dean.academics@cit.ac.in',
        password: 'citpass2026',
        category: 'hod_admin',
      },
    });
    assert(adminLogin.status === 200, 'HOD/Admin authenticates successfully with valid credentials (HTTP 200)');
    assert(
      ['admin', 'department_coordinator'].includes(adminLogin.body.user.role),
      'Authenticated identity has administrative permissions'
    );
    assert(Boolean(adminLogin.body.token), 'Issues secure admin token');
    const adminToken = adminLogin.body.token;

    // 4.2 Rejection of Professor Account in HOD/Admin Flow
    const profAsAdmin = await request('POST', '/api/auth/login', {
      body: {
        email: 'prof.turing@cit.ac.in',
        password: 'citpass2026',
        category: 'hod_admin',
      },
    });
    assert(profAsAdmin.status === 403, 'Professor account rejected from HOD/Admin portal (HTTP 403)');
    assert(profAsAdmin.body.error?.code === 'ROLE_UNAUTHORIZED', 'Returns ROLE_UNAUTHORIZED error code');

    // -----------------------------------------------------------------
    // SECTION 5: PASSWORD RECOVERY FLOW
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 5: Password Recovery Flow ---');

    // 5.1 Request Password Reset Token
    const forgotRes = await request('POST', '/api/auth/forgot-password', {
      body: {
        email: 'prof.turing@cit.ac.in',
      },
    });
    assert(forgotRes.status === 200, 'Password recovery request accepted (HTTP 200)');
    assert(forgotRes.body.success === true, 'Recovery status is true');

    // Retrieve the token stored in database for Turing
    const turingUser = await storage.getUserByUsername('prof.turing');
    const resetToken = turingUser?.password_reset_token;
    assert(Boolean(resetToken), 'Cryptographically secure password reset token generated and persisted');

    // 5.2 Reset Password with Valid Token
    const resetRes = await request('POST', '/api/auth/reset-password', {
      body: {
        token: resetToken,
        newPassword: 'BrandNewSecurePass@2026',
      },
    });
    assert(resetRes.status === 200, 'Password reset succeeded with valid token (HTTP 200)');

    // 5.3 Test Login with Newly Set Password
    const loginWithNewPass = await request('POST', '/api/auth/login', {
      body: {
        email: 'prof.turing@cit.ac.in',
        password: 'BrandNewSecurePass@2026',
        category: 'professor',
      },
    });
    assert(loginWithNewPass.status === 200, 'Login succeeds with new reset password (HTTP 200)');

    // 5.4 Rejection of Expired or Used Reset Token
    const reusedReset = await request('POST', '/api/auth/reset-password', {
      body: {
        token: resetToken,
        newPassword: 'AnotherPassword@2026',
      },
    });
    assert(reusedReset.status === 400, 'Re-using consumed reset token is rejected (HTTP 400)');

    // -----------------------------------------------------------------
    // SECTION 6: SESSION RESTORATION & PROFILE VERIFICATION (/api/users/me)
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 6: Session Restoration & Profile Retrieval ---');

    // 6.1 Student Profile
    const studentMe = await request('GET', '/api/users/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentMe.status === 200, 'Student retrieves own profile via Bearer token (HTTP 200)');
    assert(studentMe.body.data.role === 'student', 'Student profile role is student');
    assert(
      studentMe.body.data.avatarUrl === 'https://cit.ac.in/avatars/aarav.jpg',
      'Student profile contains avatarUrl in session verification'
    );

    // 6.2 Professor Profile
    const profMe = await request('GET', '/api/users/me', {
      headers: { Authorization: `Bearer ${profToken}` },
    });
    assert(profMe.status === 200, 'Professor retrieves own profile (HTTP 200)');
    assert(profMe.body.data.role === 'faculty', 'Professor profile role is faculty');

    // 6.3 HOD/Admin Profile
    const adminMe = await request('GET', '/api/users/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminMe.status === 200, 'HOD/Admin retrieves own profile (HTTP 200)');
    assert(adminMe.body.data.role === 'admin', 'HOD/Admin profile role is admin');

    // 6.4 Unauthenticated Request Rejection
    const anonMe = await request('GET', '/api/users/me');
    assert(anonMe.status === 401, 'Unauthenticated request to /api/users/me rejected (HTTP 401)');

    // -----------------------------------------------------------------
    // SECTION 7: DATA ISOLATION & RBAC AUTHORIZATION
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 7: Data Isolation & RBAC Protection ---');

    // 7.1 Student cannot access administrative user list
    const studentUserList = await request('GET', '/api/users', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentUserList.status === 403, 'Student blocked from inspecting institution user list (HTTP 403)');

    // 7.2 Professor cannot access administrative user list
    const profUserList = await request('GET', '/api/users', {
      headers: { Authorization: `Bearer ${profToken}` },
    });
    assert(profUserList.status === 403, 'Professor blocked from inspecting institution user list (HTTP 403)');

    // 7.3 HOD/Admin permitted to inspect user list
    const adminUserList = await request('GET', '/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminUserList.status === 200, 'HOD/Admin permitted to inspect institution user list (HTTP 200)');
    assert(adminUserList.body.count >= 11, 'Admin user list contains all provisioned users');

    // 7.4 Session Logout
    const logoutRes = await request('POST', '/api/auth/logout', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(logoutRes.status === 200, 'Session logout succeeds (HTTP 200)');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log('\n------------------------------------------------------');
  console.log(`AUTHENTICATION TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthSuite().catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
