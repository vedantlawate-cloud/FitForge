#!/usr/bin/env node
/**
 * FitForge — db-init.js
 * Idempotent database initializer — safe to run on every deploy.
 * Uses IF NOT EXISTS throughout so re-runs never fail.
 */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: __dirname + '/.env' });
}
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host    : process.env.DB_HOST     || 'localhost',
      port    : parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'fitforge',
      user    : process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });

async function runFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    await pool.query(sql);
    console.log(`✅ Ran: ${path.basename(filePath)}`);
  } catch (err) {
    // These are all safe to ignore on re-runs
    const safeErrors = [
      'already exists',
      'duplicate key',
      'already been done',
    ];
    const isSafe = safeErrors.some(e => err.message.toLowerCase().includes(e));
    if (isSafe) {
      console.log(`ℹ️  ${path.basename(filePath)} — already up to date`);
    } else {
      throw err; // Re-throw real errors
    }
  }
}

async function init() {
  console.log('🏋️  FitForge DB Init Starting...\n');
  try {
    await runFile(path.join(__dirname, 'db/schema.sql'));
    await runFile(path.join(__dirname, 'db/seed.sql'));
    console.log('\n✅ Database ready!');
  } catch (err) {
    console.error('❌ DB Init failed:', err.message);
    // Don't call process.exit(1) — let Railway continue to start the server
    // The server has its own error handling for DB issues
  } finally {
    await pool.end();
  }
}

init();
