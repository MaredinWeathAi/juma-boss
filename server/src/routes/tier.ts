import { Router } from 'express';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { FEATURE_TIERS, HOBBY_LIMITS, TierLevel } from '../middleware/tierGuard.js';

const router = Router();

const TIER_INFO = {
  hobby: {
    name: 'Free',
    price: 0,
    priceLabel: 'Free forever',
    description: 'Perfect for home bakers just getting started',
    features: [
      'Pricing calculator',
      `Up to ${HOBBY_LIMITS.maxProducts} products`,
      `Up to ${HOBBY_LIMITS.maxOrdersPerMonth} orders/month`,
      `Up to ${HOBBY_LIMITS.maxCustomers} customers`,
      'Basic dashboard',
    ],
    color: '#6B7280',
  },
  growing: {
    name: 'Starter',
    price: 29,
    priceLabel: '$29/month',
    description: 'For bakers ready to grow their business',
    features: [
      'Everything in Free',
      'Online storefront',
      'Production calendar',
      'Inventory management',
      'Unlimited orders',
      'Unlimited products',
      'Unlimited customers',
    ],
    color: '#F59E0B',
  },
  pro: {
    name: 'Pro',
    price: 79,
    priceLabel: '$79/month',
    description: 'For serious bakery businesses',
    features: [
      'Everything in Starter',
      'Wholesale management',
      'Employee scheduling',
      'AI pricing engine',
      'Financial reports',
      'Advanced CRM',
    ],
    color: '#F97316',
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    priceLabel: '$199/month',
    description: 'For bakery empires',
    features: [
      'Everything in Pro',
      'Marketplace listing',
      'API access',
      'White-label branding',
      'Priority support',
      'Advanced analytics',
    ],
    color: '#DC2626',
  },
};

// GET tier info for all tiers
router.get('/plans', (_req: AuthRequest, res) => {
  res.json(TIER_INFO);
});

// GET current user's tier with usage stats
router.get('/current', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(req.userId) as any;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const tier = (user.tier || 'hobby') as TierLevel;

    // Get usage stats for hobby tier limits
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const orderCount = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND created_at >= ?').get(req.userId, thirtyDaysAgo) as any).count;
    const productCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ?').get(req.userId) as any).count;
    const customerCount = (db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ?').get(req.userId) as any).count;

    res.json({
      tier,
      tierInfo: TIER_INFO[tier],
      usage: {
        orders: { current: orderCount, limit: tier === 'hobby' ? HOBBY_LIMITS.maxOrdersPerMonth : null },
        products: { current: productCount, limit: tier === 'hobby' ? HOBBY_LIMITS.maxProducts : null },
        customers: { current: customerCount, limit: tier === 'hobby' ? HOBBY_LIMITS.maxCustomers : null },
      },
      featureAccess: FEATURE_TIERS,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tier info' });
  }
});

// POST upgrade tier (simulated — in production this would go through Stripe)
router.post('/upgrade', authenticateToken, (req: AuthRequest, res) => {
  const { tier } = req.body;
  const db = getDatabase();

  const validTiers = ['hobby', 'growing', 'pro', 'enterprise'];
  if (!tier || !validTiers.includes(tier)) {
    res.status(400).json({ error: 'Invalid tier' });
    return;
  }

  try {
    db.prepare('UPDATE users SET tier = ? WHERE id = ?').run(tier, req.userId);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;

    res.json({
      success: true,
      message: `Successfully upgraded to ${TIER_INFO[tier as TierLevel].name} plan!`,
      tier: user.tier,
      tierInfo: TIER_INFO[tier as TierLevel],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upgrade tier' });
  }
});

export default router;
