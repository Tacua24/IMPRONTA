import mysql from 'mysql2/promise';

const connectionUrl = process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error('DATABASE_URL env var is required');
}

const url = new URL(connectionUrl);

const sslMode = url.searchParams.get('ssl-mode')?.toUpperCase();
const sslRequired = sslMode === 'REQUIRED';

export const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  waitForConnections: true,
  connectionLimit: 10,
  ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
});

export async function healthCheck() {
  const [rows] = await pool.query('SELECT 1 as ok');
  return rows[0]?.ok === 1;
}
backend/src/routes/auth.js
New
+23-0
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    await pool.execute(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, password, name ?? null]
    );
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    next(error);
  }
});

export default router;
