import { Response, NextFunction } from 'express';
import { getDatabase } from '../db/index.js';
import { AuthRequest } from './auth.js';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const db = getDatabase();
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;

  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}
