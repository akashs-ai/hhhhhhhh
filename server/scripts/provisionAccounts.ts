/**
 * CIT Scheduling Platform - Secure Initial Account Provisioning Engine
 * 
 * Provisions:
 * - Exactly ONE initial HOD/Admin account
 * - Exactly TEN initial Professor accounts
 * 
 * Security features:
 * - Idempotent: safe to execute multiple times without duplicate creation
 * - Cryptographically secure temporary password generation (never hardcoded in source)
 * - Server-side password hashing (SHA-256)
 * - Outputs private, operator-controlled credentials report
 * - Credentials written strictly to gitignored local report file (.cit_provisioned_credentials.json)
 * 
 * Usage:
 *   npx tsx server/scripts/provisionAccounts.ts [--force-reset] [--json]
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { storage } from '../storage.js';
import { UserRecord } from '../storageInterface.js';

interface ProvisionAccountConfig {
  id: string;
  username: string;
  display_name: string;
  email: string;
  role: 'admin' | 'faculty';
  category: 'HOD/Admin' | 'Professor';
  department: string;
  faculty_id?: string;
}

export interface ProvisionResultItem {
  email: string;
  username: string;
  display_name: string;
  category: 'HOD/Admin' | 'Professor';
  role: string;
  department: string;
  status: 'active' | 'suspended' | 'pending';
  account_action: 'newly_created' | 'already_existed' | 'credentials_reset';
  initial_temporary_password?: string;
  password_setup_instructions: string;
}

// Exactly 1 Initial HOD/Admin Account
const INITIAL_ADMIN: ProvisionAccountConfig = {
  id: 'usr-admin-primary',
  username: 'admin.hod',
  display_name: 'Dr. S. K. Nayak (Dean Academics & Head of Institution)',
  email: process.env.PROVISION_ADMIN_EMAIL || 'dean.academics@cit.ac.in',
  role: 'admin',
  category: 'HOD/Admin',
  department: 'ADMIN',
};

// Exactly 10 Initial Professor Accounts spanning authoritative academic departments
const INITIAL_PROFESSORS: ProvisionAccountConfig[] = [
  {
    id: 'usr-fac-turing',
    username: 'prof.turing',
    display_name: 'Prof. Alan Turing',
    email: 'prof.turing@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'CSE',
    faculty_id: 'F01',
  },
  {
    id: 'usr-fac-ramanujan',
    username: 'prof.ramanujan',
    display_name: 'Prof. S. Ramanujan',
    email: 'prof.ramanujan@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'MA',
    faculty_id: 'F19',
  },
  {
    id: 'usr-fac-lovelace',
    username: 'prof.lovelace',
    display_name: 'Prof. Ada Lovelace',
    email: 'prof.lovelace@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'CSE',
    faculty_id: 'F02',
  },
  {
    id: 'usr-fac-shannon',
    username: 'prof.shannon',
    display_name: 'Prof. Claude Shannon',
    email: 'prof.shannon@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'ECE',
    faculty_id: 'F09',
  },
  {
    id: 'usr-fac-hopper',
    username: 'prof.hopper',
    display_name: 'Prof. Grace Hopper',
    email: 'prof.hopper@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'CSE',
    faculty_id: 'F04',
  },
  {
    id: 'usr-fac-tesla',
    username: 'prof.tesla',
    display_name: 'Prof. Nikola Tesla',
    email: 'prof.tesla@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'EE',
    faculty_id: 'F14',
  },
  {
    id: 'usr-fac-curie',
    username: 'prof.curie',
    display_name: 'Prof. Marie Curie',
    email: 'prof.curie@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'PH',
    faculty_id: 'F21',
  },
  {
    id: 'usr-fac-feynman',
    username: 'prof.feynman',
    display_name: 'Prof. Richard Feynman',
    email: 'prof.feynman@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'PH',
    faculty_id: 'F22',
  },
  {
    id: 'usr-fac-brunel',
    username: 'prof.brunel',
    display_name: 'Prof. Isambard Brunel',
    email: 'prof.brunel@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'CE',
    faculty_id: 'F31',
  },
  {
    id: 'usr-fac-watt',
    username: 'prof.watt',
    display_name: 'Prof. James Watt',
    email: 'prof.watt@cit.ac.in',
    role: 'faculty',
    category: 'Professor',
    department: 'ME',
    faculty_id: 'F25',
  },
];

/**
 * Generates a cryptographically strong temporary password.
 */
function generateSecureTempPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*';
  
  let pwd = 'CIT';
  pwd += letters[crypto.randomInt(0, letters.length)];
  pwd += numbers[crypto.randomInt(0, numbers.length)];
  pwd += symbols[crypto.randomInt(0, symbols.length)];
  
  const randBytes = crypto.randomBytes(6).toString('hex');
  return `${pwd}-${randBytes}`;
}

export async function provisionInitialAccounts(options: { forceReset?: boolean } = {}): Promise<ProvisionResultItem[]> {
  const allAccountsToProvision = [INITIAL_ADMIN, ...INITIAL_PROFESSORS];
  const results: ProvisionResultItem[] = [];

  const existingUsers = Object.values(await storage.getAllUsers());

  for (const cfg of allAccountsToProvision) {
    // Check if user already exists by ID, email, or username
    const existing = existingUsers.find(
      (u) =>
        u.id === cfg.id ||
        u.email.toLowerCase() === cfg.email.toLowerCase() ||
        u.username.toLowerCase() === cfg.username.toLowerCase()
    );

    if (existing && !options.forceReset) {
      results.push({
        email: existing.email,
        username: existing.username,
        display_name: existing.display_name,
        category: cfg.category,
        role: existing.role,
        department: existing.department || cfg.department,
        status: existing.status,
        account_action: 'already_existed',
        password_setup_instructions:
          'Account is already active. Use registered institutional credentials or use the password recovery flow.',
      });
      continue;
    }

    const tempPassword = generateSecureTempPassword();
    const passwordHash = crypto.createHash('sha256').update(tempPassword).digest('hex');
    const authToken = `token-${cfg.id}-${Date.now()}`;

    if (existing && options.forceReset) {
      await storage.updateUser(existing.id, {
        password_hash: passwordHash,
        auth_tokens: [authToken],
        status: 'active',
      });

      results.push({
        email: existing.email,
        username: existing.username,
        display_name: existing.display_name,
        category: cfg.category,
        role: existing.role,
        department: existing.department || cfg.department,
        status: 'active',
        account_action: 'credentials_reset',
        initial_temporary_password: tempPassword,
        password_setup_instructions:
          'Temporary password provisioned. Must be changed upon initial sign-in.',
      });
    } else {
      const newUser: Omit<UserRecord, 'created_at' | 'updated_at'> = {
        id: cfg.id,
        username: cfg.username,
        display_name: cfg.display_name,
        email: cfg.email,
        role: cfg.role,
        status: 'active',
        department: cfg.department,
        faculty_id: cfg.faculty_id,
        auth_tokens: [authToken],
        password_hash: passwordHash,
      };

      await storage.createUser(newUser);

      await storage.logAudit({
        user_id: 'sys-provision',
        user_name: 'Initial Account Provisioner',
        role: 'admin',
        action: 'PROVISION_INITIAL_ACCOUNT',
        resource_type: 'user',
        resource_id: cfg.id,
        details: { category: cfg.category, email: cfg.email, role: cfg.role },
        status: 'success',
      });

      results.push({
        email: cfg.email,
        username: cfg.username,
        display_name: cfg.display_name,
        category: cfg.category,
        role: cfg.role,
        department: cfg.department,
        status: 'active',
        account_action: 'newly_created',
        initial_temporary_password: tempPassword,
        password_setup_instructions:
          'Initial temporary password generated. User must sign in and update password.',
      });
    }
  }

  return results;
}

// CLI Execution entrypoint
async function main() {
  const args = process.argv.slice(2);
  const forceReset = args.includes('--force-reset');
  const jsonOutput = args.includes('--json');

  console.log('================================================================');
  console.log('CIT SCHEDULING PLATFORM — SECURE ACCOUNT PROVISIONING');
  console.log('================================================================\n');
  console.log(`Mode: Initial Provisioning (forceReset=${forceReset})`);
  console.log(`Target: Exactly 1 HOD/Admin Account + Exactly 10 Professor Accounts\n`);

  try {
    const report = await provisionInitialAccounts({ forceReset });

    const newCount = report.filter((r) => r.account_action === 'newly_created').length;
    const existingCount = report.filter((r) => r.account_action === 'already_existed').length;
    const resetCount = report.filter((r) => r.account_action === 'credentials_reset').length;

    console.log(`SUMMARY: ${report.length} accounts processed.`);
    console.log(`  - Newly Created: ${newCount}`);
    console.log(`  - Already Existed: ${existingCount}`);
    console.log(`  - Credentials Reset: ${resetCount}\n`);

    // Write private report to gitignored file for the operator
    const reportPath = path.resolve(process.cwd(), '.cit_provisioned_credentials.json');
    const privateReport = {
      timestamp: new Date().toISOString(),
      institution: 'Chilika Institute of Technology',
      total_accounts: report.length,
      operator_warning: 'CONFIDENTIAL: Contains temporary provisioning credentials. Do not commit or share.',
      accounts: report,
    };
    fs.writeFileSync(reportPath, JSON.stringify(privateReport, null, 2), 'utf-8');

    if (jsonOutput) {
      console.log(JSON.stringify(privateReport, null, 2));
    } else {
      console.log('---------------------------------------------------------------------------------------------------');
      console.log(
        'CATEGORY    | EMAIL                        | NAME                    | STATUS         | INITIAL TEMP PASSWORD'
      );
      console.log('---------------------------------------------------------------------------------------------------');
      for (const item of report) {
        const cat = item.category.padEnd(11);
        const email = item.email.padEnd(28);
        const name = item.display_name.slice(0, 23).padEnd(23);
        const action = item.account_action.padEnd(14);
        const pwd = item.initial_temporary_password || '(Preserved / Secure)';
        console.log(`${cat} | ${email} | ${name} | ${action} | ${pwd}`);
      }
      console.log('---------------------------------------------------------------------------------------------------');
      console.log(`\nPrivate operator credential report securely saved to:`);
      console.log(`  ${reportPath} (Protected & Gitignored)\n`);
    }

    process.exit(0);
  } catch (err: any) {
    console.error('ERROR during account provisioning:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('provisionAccounts.ts')) {
  main();
}
