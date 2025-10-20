import mysql from 'mysql2/promise';
import { parse } from 'url';

const connectionUrl = process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error('DATABASE_URL env var is required');
}

const { hostname, port, username, password, pathname, query } = parse(connectionUrl);

const sslRequired = query?.includes('ssl-mode=REQUIRED');

export const pool = mysql.createPool({
  host: hostname,
  port: Number(port ?? 3306),
  user: username,
  password,
  database: pathname?.replace(/^\//, ''),
  waitForConnections: true,
  connectionLimit: 10,
  ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
});

export async function healthCheck() {
  const [rows] = await pool.query('SELECT 1 as ok');
  return rows[0]?.ok === 1;
}
