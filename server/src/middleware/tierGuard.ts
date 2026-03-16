import { Response, NextFunction } from 'express';
import { getDatabase } from '../db/index.js';
import { AuthRequest } from './auth.js';

export type TierLevel = 'hobby' | 'growing' | 'pro' | 'enterprise';

const TIER_HIERARCHY: Record<TierLevel, number> = {
  hobby: 0,
  growing: 1,
  pro: 2,
  enterprise: 3,
};

// Which features are available at which minimum tier
export const FEATURE_TIERS: Record<string, TierLevel> = {
  // Hobby (Free)
  'pricing:basic': 'hobby',
  'orders:basic': 'hobby',
  'products:basic': 'hobby',
  'customers:basic': 'hobby',
  'dashboard:basic': 'hobby',

  // Growing (Starter)
  'storefront': 'growing',
  'production': 'growing',
  'inventory': 'growing',
  'orders:unlimited': 'growing',
  'products:unlimited': 'growing',
  'customers:unlimited': 'growing',

  // Pro
  'wholesale': 'pro',
  'employees': 'pro',
  'pricing:ai': 'pro',
  'financial': 'pro',
  'customers:crm': 'pro',

  // Enterprise
  'marketplace': 'enterprise',
  'api': 'enterprise',
  'whitelabel': 'enterprise',
  'analytics:advanced': 'enterprise',
};

// Limits for hobby tier
export const HOBBY_LIMITS = {
  maxOrdersPerMonth: 20,
  maxProducts: 5,
  maxCustomers: 10,
};

export function hasTierAccess(userTier: TierLevel, requiredTier: TierLevel): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

export function requireTier(minimumTier: TierLevel) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const db = getDatabase();
    const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(req.userId) as any;

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const userTier = (user.tier || 'hobby') as TierLevel;

    if (!hasTierAccess(userTier, minimumTier)) {
      res.status(403).json({
        error: 'Upgrade required',
        requiredTier: minimumTier,
        currentTier: userTier,
        message: `This feature requires the ${minimumTier} plan or higher.`
      });
      return;
    }

    next();
  };
}

export function checkHobbyLimits(resource: 'orders' | 'products' | 'customers') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const db = getDatabase();
    const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(req.userId) as any;

    if (!user || user.tier !== 'hobby') {
      next();
      return;
    }

    let count = 0;
    if (resource === 'orders') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const result = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND created_at >= ?').get(req.userId, thirtyDaysAgo) as any;
      count = result.count;
      if (count >= HOBBY_LIMITS.maxOrdersPerMonth) {
        res.status(403).json({ error: 'Upgrade required', message: `Free plan is limited to ${HOBBY_LIMITS.maxOrdersPerMonth} orders per month. Upgrade to Growing for unlimited orders.`, requiredTier: 'growing', currentTier: 'hobby' });
        return;
      }
    } else if (resource === 'products') {
      const result = db.prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ?').get(req.userId) as any;
      count = result.count;
      if (count >= HOBBY_LIMITS.maxProducts) {
        res.status(403).json({ error: 'Upgrade required', message: `Free plan is limited to ${HOBBY_LIMITS.maxProducts} products. Upgrade to Growing for unlimited products.`, requiredTier: 'growing', currentTier: 'hobby' });
        return;
      }
    } else if (resource === 'customers') {
      const result = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ?').get(req.userId) as any;
      count = result.count;
      if (count >= HOBBY_LIMITS.maxCustomers) {
        res.status(403).json({ error: 'Upgrade required', message: `Free plan is limited to ${HOBBY_LIMITS.maxCustomers} customers. Upgrade to Growing for unlimited customers.`, requiredTier: 'growing', currentTier: 'hobby' });
        return;
      }
    }

    next();
  };
}
