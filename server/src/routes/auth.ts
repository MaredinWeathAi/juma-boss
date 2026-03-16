import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req: AuthRequest, res) => {
  const { email, password, name, bakeryName } = req.body;

  if (!email || !password || !name || !bakeryName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const db = getDatabase();

  // Check if user already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(400).json({ error: 'User already exists' });
    return;
  }

  const userId = uuidv4();
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const bakerySlug = bakeryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  try {
    db.prepare(`
      INSERT INTO users (id, email, password, name, bakery_name, bakery_slug, tier, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      email,
      hashedPassword,
      name,
      bakeryName,
      bakerySlug,
      'hobby',
      new Date().toISOString()
    );

    const token = generateToken(userId, email);
    res.status(201).json({
      id: userId,
      email,
      name,
      bakeryName,
      bakerySlug,
      tier: 'hobby',
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/login', (req: AuthRequest, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const db = getDatabase();

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user || !bcryptjs.compareSync(password, user.password)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user.id, user.email);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      bakeryName: user.bakery_name,
      bakerySlug: user.bakery_slug,
      phone: user.phone,
      bio: user.bio,
      profileImage: user.profile_image,
      tier: user.tier,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      bakeryName: user.bakery_name,
      bakerySlug: user.bakery_slug,
      phone: user.phone,
      bio: user.bio,
      profileImage: user.profile_image,
      tier: user.tier,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
