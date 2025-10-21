// backend/src/db.js
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

const connectionUrl = process.env.DATABASE_URL;
if (!connectionUrl) {
  throw new Error('DATABASE_URL env var is required');
}

// SSL: si tu URL trae ssl-mode=REQUIRED, activamos TLS.
// Si defines MYSQL_CA_PATH, cargamos el CA (recomendado para Aiven).
let ssl = undefined;
try {
  const u = new URL(connectionUrl);
  const sslMode = u.searchParams.get('ssl-mode')?.toUpperCase();
  if (sslMode === 'REQUIRED') {
    ssl = process.env.MYSQL_CA_PATH
      ? { ca: fs.readFileSync(process.env.MYSQL_CA_PATH), rejectUnauthorized: true }
      : { rejectUnauthorized: true };
  }
} catch {
  // Si por alguna razón URL falla, seguimos sin romper; 'uri' manejará la cadena.
}

export const pool = mysql.createPool({
  uri: connectionUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl, // se aplica solo si corresponde
});

export async function healthCheck() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows?.[0]?.ok === 1;
}

