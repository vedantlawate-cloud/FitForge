#!/usr/bin/env node
/**
 * FitForge — db-init.js
 * Run once on Railway after first deploy to create tables and seed data.
 *
 * Usage (in Railway dashboard → your service → Settings → Deploy → "Start Command"):
 *   node backend/db-init.js
 *
 * Or locally:
 *   node backend/db-init.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
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
  // Split on semicolons but keep simple — works for our schema
  await pool.query(sql);
  console.log(`✅ Ran: ${path.basename(filePath)}`);
}

async function init() {
  console.log('🏋️  FitForge DB Init Starting...\n');

  try {
    await runFile(path.join(__dirname, 'db/schema.sql'));
    await runFile(path.join(__dirname, 'db/seed.sql'));
    console.log('\n✅ Database initialized successfully!');
  } catch (err) {
    // "already exists" errors are fine on re-run
    if (err.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist — schema is up to date.');
    } else {
      console.error('❌ Init error:', err.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

init();
