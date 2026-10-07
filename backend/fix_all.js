/**
 * FIX ALL — Asset Management System
 * ====================================
 * 1. Tests DB connection
 * 2. Shows all existing users
 * 3. Force-creates / force-updates ALL login accounts with correct bcrypt hashes
 * 4. Verifies every password works
 * 5. Shows final login table
 *
 * Run:  node fix_all.js   (from the backend folder)
 */

require('dotenv').config()
const mysql  = require('mysql2')
const bcrypt = require('bcrypt')

// ── Direct connection (no dotenv dependency) ─────────────
const db = mysql.createConnection({
  host:     'localhost',
  user:     'root',
  password: '233889@ky',
  database: 'asset_management'
})

function q(sql, params = []) {
  return new Promise((res, rej) =>
    db.query(sql, params, (e, r) => e ? rej(e) : res(r))
  )
}

const ACCOUNTS = [
  { name: 'System Admin',          email: 'admin@assets.com',        password: 'admin123',       role: 'admin',               department: 'IT' },
  { name: 'John Manager',          email: 'manager@assets.com',      password: 'manager123',     role: 'manager',             department: 'Operations' },
  { name: 'Alice Officer',         email: 'assetofficer@assets.com', password: 'officer123',     role: 'asset_officer',       department: 'Asset Management' },
  { name: 'Bob Finance',           email: 'finance@assets.com',      password: 'finance123',     role: 'finance_officer',     department: 'Finance' },
  { name: 'Carol Maintenance',     email: 'maintenance@assets.com',  password: 'maintenance123', role: 'maintenance_officer', department: 'Maintenance' },
  { name: 'David Employee',        email: 'employee@assets.com',     password: 'employee123',    role: 'employee',            department: 'Sales' },
  { name: 'Eve Employee',          email: 'eve@assets.com',          password: 'employee123',    role: 'employee',            department: 'HR' },
]

async function run() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║     Asset Management System — FIX ALL       ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  // 1. Test DB
  await new Promise((res, rej) => db.connect(e => e ? rej(e) : res()))
  console.log('✅ Database connected\n')

  // 2. Show existing users
  const existing = await q('SELECT user_id, email, role, is_active FROM users ORDER BY user_id')
  if (existing.length === 0) {
    console.log('⚠️  No users in database yet — creating all accounts...\n')
  } else {
    console.log(`Found ${existing.length} existing user(s):`)
    existing.forEach(u => console.log(`  [${u.user_id}] ${u.email.padEnd(38)} role: ${u.role.padEnd(22)} active: ${u.is_active}`))
    console.log()
  }

  // 3. Force upsert every account
  console.log('Fixing accounts...')
  for (const acc of ACCOUNTS) {
    const hash = await bcrypt.hash(acc.password, 10)
    const rows = await q('SELECT user_id FROM users WHERE email = ?', [acc.email])

    if (rows.length > 0) {
      await q(
        'UPDATE users SET name=?, password=?, role=?, department=?, is_active=1 WHERE email=?',
        [acc.name, hash, acc.role, acc.department, acc.email]
      )
      console.log(`  ✅ Updated:  ${acc.email}`)
    } else {
      // Check if department column exists
      const cols = await q("SHOW COLUMNS FROM users LIKE 'department'")
      if (cols.length > 0) {
        await q(
          'INSERT INTO users (name, email, password, role, department, is_active, created_at) VALUES (?,?,?,?,?,1,NOW())',
          [acc.name, acc.email, hash, acc.role, acc.department]
        )
      } else {
        await q(
          'INSERT INTO users (name, email, password, role, is_active, created_at) VALUES (?,?,?,?,1,NOW())',
          [acc.name, acc.email, hash, acc.role]
        )
      }
      console.log(`  ➕ Created:  ${acc.email}`)
    }
  }

  // 4. Verify every password
  console.log('\nVerifying passwords...')
  let allOk = true
  for (const acc of ACCOUNTS) {
    const rows = await q('SELECT password, is_active FROM users WHERE email = ?', [acc.email])
    if (!rows.length) { console.log(`  ❌ MISSING:  ${acc.email}`); allOk = false; continue }
    const ok = await bcrypt.compare(acc.password, rows[0].password)
    if (!ok) { console.log(`  ❌ BAD HASH: ${acc.email}`); allOk = false; continue }
    console.log(`  ✅ OK:  ${acc.email}`)
  }

  // 5. Print final table
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║              LOGIN CREDENTIALS              ║')
  console.log('╠══════════════════════════════════════════════╣')
  ACCOUNTS.forEach(a =>
    console.log(`║  ${a.email.padEnd(32)} ${a.password.padEnd(16)}║`)
  )
  console.log('╚══════════════════════════════════════════════╝')

  if (allOk) {
    console.log('\n✅ All accounts fixed! Login should work now.')
    console.log('   Start the server:  node server.js\n')
  } else {
    console.log('\n⚠️  Some accounts had issues — check errors above.\n')
  }

  db.end()
}

run().catch(e => {
  console.error('\n❌ FAILED:', e.message)
  console.error('   Make sure MySQL is running and the database exists.\n')
  db.end()
  process.exit(1)
})
