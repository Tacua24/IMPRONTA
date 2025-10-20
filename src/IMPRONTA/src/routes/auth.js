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

