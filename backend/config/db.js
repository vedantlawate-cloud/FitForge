const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

// Railway provides DATABASE_URL automatically when you add a Postgres plugin.
// Locally we fall back to individual DB_* variables from .env
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required by Railway's Postgres
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      host    : process.env.DB_HOST     || 'localhost',
      port    : parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'fitforge',
      user    : process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 New DB client connected');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected DB error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
