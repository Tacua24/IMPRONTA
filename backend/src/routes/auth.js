import { Router } from 'express';
import crypto from 'node:crypto';

import { pool } from '../db.js';

const router = Router();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET env var is required');
}

const accessTokenTtl = parseDurationToSeconds(process.env.JWT_EXPIRES_IN ?? '15m');
const passwordKeyLength = 64;

function parseDurationToSeconds(value) {
  if (!value) return 900;
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const match = /^([0-9]+)([smhd])$/i.exec(value);
  if (!match) {
    throw new Error('JWT_EXPIRES_IN must be an integer (seconds) or use the format <number>[s|m|h|d]');
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  return amount * factor;
}

function base64UrlEncode(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url');
}

function timingSafeEqual(a, b) {
  const bufferA = Buffer.isBuffer(a) ? a : Buffer.from(a);
  const bufferB = Buffer.isBuffer(b) ? b : Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: issuedAt, exp: issuedAt + accessTokenTtl };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(body));
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = crypto.createHmac('sha256', jwtSecret).update(data).digest('base64url');

  return `${data}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token');
  }

  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = crypto.createHmac('sha256', jwtSecret).update(data).digest('base64url');

  if (!timingSafeEqual(signature, expected)) {
    throw new Error('Invalid signature');
  }

  const headerBuffer = base64UrlDecode(header);
  const headerJson = headerBuffer.toString('utf8');
  const headerData = JSON.parse(headerJson);
  if (headerData.alg !== 'HS256') {
    throw new Error('Unsupported algorithm');
  }

  const payloadBuffer = base64UrlDecode(payload);
  const payloadJson = payloadBuffer.toString('utf8');
  const parsed = JSON.parse(payloadJson);
  const now = Math.floor(Date.now() / 1000);

  if (parsed.exp && now >= parsed.exp) {
    throw new Error('Token expired');
  }

  return parsed;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, passwordKeyLength).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, hash) {
  const [salt, original] = hash.split(':');
  if (!salt || !original) {
    return false;
  }

  const derived = crypto.scryptSync(password, salt, passwordKeyLength).toString('hex');
  return timingSafeEqual(Buffer.from(original, 'hex'), Buffer.from(derived, 'hex'));
}

function validateEmail(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

function validatePassword(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= 8 && trimmed.length <= 255 ? trimmed : null;
}

function validateName(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 255 ? trimmed : undefined;
}

function buildValidationError(res, message) {
  return res.status(400).json({ message });
}

function mapUser(row) {
  const createdAt = row.created_at ? new Date(row.created_at).toISOString() : null;
  const updatedAt = row.updated_at ? new Date(row.updated_at).toISOString() : null;
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    createdAt,
    updatedAt,
  };
}

function authenticate(req, res, next) {
  const authHeader = req.get('authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ message: 'Token de autenticación faltante o inválido.' });
  }

  try {
    const payload = verifyToken(token);
    const rawUserId = payload?.sub ?? payload?.id ?? payload?.userId;
    const userId = Number(rawUserId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Token de autenticación inválido.' });
    }

    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}

router.post('/register', async (req, res, next) => {
  const email = validateEmail(req.body?.email);
  if (!email) {
    return buildValidationError(res, 'El email proporcionado no es válido.');
  }

  const password = validatePassword(req.body?.password);
  if (!password) {
    return buildValidationError(res, 'La contraseña debe tener entre 8 y 255 caracteres.');
  }

  const nameValidation = validateName(req.body?.name);
  if (nameValidation === undefined) {
    return buildValidationError(res, 'El nombre debe ser una cadena de texto.');
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'El email ya se encuentra registrado.' });
    }

    const passwordHash = hashPassword(password);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, nameValidation]
    );

    const insertedId = result.insertId;
    const [rows] = await pool.query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [insertedId]
    );

    const userRow = rows[0] ?? { id: insertedId, email, name: nameValidation ?? null };
    const user = mapUser(userRow);
    const token = signToken({ sub: String(user.id), email: user.email });

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const email = validateEmail(req.body?.email);
  if (!email) {
    return buildValidationError(res, 'El email proporcionado no es válido.');
  }

  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : null;
  if (!rawPassword) {
    return buildValidationError(res, 'La contraseña es obligatoria.');
  }

  const password = rawPassword.trim();
  if (!password) {
    return buildValidationError(res, 'La contraseña es obligatoria.');
  }
  if (password.length > 255) {
    return buildValidationError(res, 'La contraseña es demasiado larga.');
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const userRow = rows[0];
    if (!userRow.password_hash || !verifyPassword(password, userRow.password_hash)) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = mapUser(userRow);
    const token = signToken({ sub: String(user.id), email: user.email });

    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const user = mapUser(rows[0]);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
