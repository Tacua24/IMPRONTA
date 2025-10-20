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
