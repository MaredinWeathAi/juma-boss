import { Router } from 'express';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminGuard.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticateToken);
router.use(requireAdmin as any);

// GET platform overview stats
router.get('/stats', (req: AuthRequest, res) => {
  const db = getDatabase();
  try {
    const totalBakers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'baker'").get() as any).count;
    const tierBreakdown = db.prepare("SELECT tier, COUNT(*) as count FROM users WHERE role = 'baker' GROUP BY tier").all() as any[];
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'").get() as any).total;
    const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count;
    const totalCustomers = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as any).count;

    // Monthly signups (last 12 months)
    const monthlySignups = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM users
      WHERE role = 'baker'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 12
    `).all() as any[];

    // Revenue by tier
    const revenueByTier = db.prepare(`
      SELECT u.tier, COALESCE(SUM(o.total_amount), 0) as revenue, COUNT(DISTINCT o.id) as orders
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
      WHERE u.role = 'baker'
      GROUP BY u.tier
    `).all() as any[];

    // Platform MRR (Monthly Recurring Revenue) based on tier pricing
    const tierPrices: Record<string, number> = { hobby: 0, growing: 29, pro: 79, enterprise: 199 };
    let mrr = 0;
    tierBreakdown.forEach((t: any) => {
      mrr += (tierPrices[t.tier] || 0) * t.count;
    });

    // Active bakers (had orders in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const activeBakers = (db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE created_at >= ?
    `).get(thirtyDaysAgo) as any).count;

    res.json({
      totalBakers,
      activeBakers,
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      mrr,
      tierBreakdown,
      monthlySignups,
      revenueByTier,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET all bakers (clients) with their stats
router.get('/clients', (req: AuthRequest, res) => {
  const db = getDatabase();
  try {
    const bakers = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.bakery_name, u.tier, u.created_at, u.phone, u.bio,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND status != 'cancelled') as total_revenue,
        (SELECT COUNT(*) FROM products WHERE user_id = u.id) as total_products,
        (SELECT COUNT(*) FROM customers WHERE user_id = u.id) as total_customers,
        (SELECT COUNT(*) FROM employees WHERE user_id = u.id) as total_employees
      FROM users u
      WHERE u.role = 'baker'
      ORDER BY u.created_at DESC
    `).all() as any[];

    const result = bakers.map((b: any) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      bakeryName: b.bakery_name,
      tier: b.tier,
      createdAt: b.created_at,
      phone: b.phone,
      bio: b.bio,
      stats: {
        totalOrders: b.total_orders,
        totalRevenue: b.total_revenue,
        totalProducts: b.total_products,
        totalCustomers: b.total_customers,
        totalEmployees: b.total_employees,
      }
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET single client detail
router.get('/clients/:id', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    const baker = db.prepare(`
      SELECT u.id, u.name, u.email, u.bakery_name, u.bakery_slug, u.tier, u.created_at, u.phone, u.bio
      FROM users u WHERE u.id = ? AND u.role = 'baker'
    `).get(id) as any;

    if (!baker) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Get their orders
    const orders = db.prepare(`
      SELECT o.*, c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT 50
    `).all(id) as any[];

    // Get their products
    const products = db.prepare('SELECT * FROM products WHERE user_id = ?').all(id) as any[];

    // Get their customers
    const customers = db.prepare('SELECT * FROM customers WHERE user_id = ?').all(id) as any[];

    // Get their employees
    const employees = db.prepare('SELECT * FROM employees WHERE user_id = ?').all(id) as any[];

    // Revenue stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE user_id = ? AND status != 'cancelled'").get(id) as any).total;
    const monthlyRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE user_id = ? AND status != 'cancelled' AND created_at >= ?").get(id, thirtyDaysAgo) as any).total;

    // Revenue by month (last 6 months)
    const revenueByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as order_count
      FROM orders
      WHERE user_id = ? AND status != 'cancelled'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 6
    `).all(id) as any[];

    // Order status breakdown
    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders WHERE user_id = ? GROUP BY status
    `).all(id) as any[];

    res.json({
      id: baker.id,
      name: baker.name,
      email: baker.email,
      bakeryName: baker.bakery_name,
      bakerySlug: baker.bakery_slug,
      tier: baker.tier,
      createdAt: baker.created_at,
      phone: baker.phone,
      bio: baker.bio,
      stats: {
        totalRevenue,
        monthlyRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalEmployees: employees.length,
      },
      revenueByMonth,
      ordersByStatus,
      recentOrders: orders.slice(0, 10).map((o: any) => ({
        id: o.id,
        customerName: o.customer_name,
        status: o.status,
        totalAmount: o.total_amount,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
      })),
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        basePrice: p.base_price,
        costPrice: p.cost_price,
        isActive: p.is_active,
      })),
      topCustomers: customers.slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        totalOrders: c.total_orders,
        totalSpent: c.total_spent,
      })),
    });
  } catch (error) {
    console.error('Client detail error:', error);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

// PUT update client tier (admin can change tiers)
router.put('/clients/:id/tier', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { tier } = req.body;

  const validTiers = ['hobby', 'growing', 'pro', 'enterprise'];
  if (!tier || !validTiers.includes(tier)) {
    res.status(400).json({ error: 'Invalid tier' });
    return;
  }

  try {
    db.prepare('UPDATE users SET tier = ? WHERE id = ? AND role = ?').run(tier, id, 'baker');
    res.json({ success: true, message: `Client tier updated to ${tier}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client tier' });
  }
});

// POST create a new baker client
router.post('/clients', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { name, email, bakeryName, password, tier, phone } = req.body;

  if (!name || !email || !bakeryName || !password) {
    res.status(400).json({ error: 'Name, email, bakery name, and password are required' });
    return;
  }

  const validTiers = ['hobby', 'growing', 'pro', 'enterprise'];
  const clientTier = tier && validTiers.includes(tier) ? tier : 'hobby';

  try {
    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Generate slug from bakery name
    const slug = bakeryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, name, email, password, bakery_name, bakery_slug, tier, role, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'baker', ?, datetime('now'))
    `).run(id, name, email, hashedPassword, bakeryName, slug, clientTier, phone || null);

    res.status(201).json({
      id,
      name,
      email,
      bakeryName,
      tier: clientTier,
      phone: phone || null,
      createdAt: new Date().toISOString(),
      stats: { totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalCustomers: 0, totalEmployees: 0 },
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT update a baker client
router.put('/clients/:id', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, email, bakeryName, password, tier, phone } = req.body;

  try {
    const existing = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'baker'").get(id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Check email uniqueness (excluding current user)
    if (email) {
      const emailTaken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id) as any;
      if (emailTaken) {
        res.status(409).json({ error: 'Another user already has this email' });
        return;
      }
    }

    const validTiers = ['hobby', 'growing', 'pro', 'enterprise'];
    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (bakeryName) {
      updates.push('bakery_name = ?');
      values.push(bakeryName);
      const slug = bakeryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      updates.push('bakery_slug = ?');
      values.push(slug);
    }
    if (tier && validTiers.includes(tier)) { updates.push('tier = ?'); values.push(tier); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }
    if (password) {
      updates.push('password = ?');
      values.push(bcrypt.hashSync(password, 10));
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    res.json({ success: true, message: 'Client updated successfully' });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE a baker client
router.delete('/clients/:id', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    const existing = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'baker'").get(id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Delete related data in order (foreign key deps)
    const deleteRelated = db.transaction(() => {
      // Delete order items for this user's orders
      db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)').run(id);
      // Delete orders
      db.prepare('DELETE FROM orders WHERE user_id = ?').run(id);
      // Delete product ingredients / recipes
      db.prepare('DELETE FROM recipes WHERE product_id IN (SELECT id FROM products WHERE user_id = ?)').run(id);
      // Delete products
      db.prepare('DELETE FROM products WHERE user_id = ?').run(id);
      // Delete customers
      db.prepare('DELETE FROM customers WHERE user_id = ?').run(id);
      // Delete employees
      db.prepare('DELETE FROM employees WHERE user_id = ?').run(id);
      // Delete ingredients
      db.prepare('DELETE FROM ingredients WHERE user_id = ?').run(id);
      // Delete wholesale accounts
      try { db.prepare('DELETE FROM wholesale_accounts WHERE user_id = ?').run(id); } catch {}
      // Delete production tasks
      try { db.prepare('DELETE FROM production_tasks WHERE user_id = ?').run(id); } catch {}
      // Delete shifts
      try { db.prepare('DELETE FROM shifts WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ?)').run(id); } catch {}
      // Finally delete the user
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });

    deleteRelated();

    res.json({ success: true, message: `Client "${existing.name}" deleted successfully` });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// GET platform analytics
router.get('/analytics', (req: AuthRequest, res) => {
  const db = getDatabase();
  try {
    // Daily orders (last 30 days)
    const dailyOrders = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all() as any[];

    // Top performing bakers
    const topBakers = db.prepare(`
      SELECT u.id, u.name, u.bakery_name, u.tier,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND status != 'cancelled') as revenue
      FROM users u
      WHERE u.role = 'baker'
      ORDER BY revenue DESC
      LIMIT 10
    `).all() as any[];

    // Most popular products across platform
    const topProducts = db.prepare(`
      SELECT p.name, p.category, u.bakery_name,
        COUNT(oi.id) as times_ordered,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN users u ON p.user_id = u.id
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `).all() as any[];

    // Tier conversion funnel
    const tierFunnel = db.prepare(`
      SELECT tier, COUNT(*) as count FROM users WHERE role = 'baker' GROUP BY tier
      ORDER BY CASE tier WHEN 'hobby' THEN 1 WHEN 'growing' THEN 2 WHEN 'pro' THEN 3 WHEN 'enterprise' THEN 4 END
    `).all() as any[];

    // Average revenue per baker by tier
    const avgRevenueByTier = db.prepare(`
      SELECT u.tier,
        COUNT(DISTINCT u.id) as baker_count,
        COALESCE(SUM(o.total_amount), 0) / MAX(COUNT(DISTINCT u.id), 1) as avg_revenue
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
      WHERE u.role = 'baker'
      GROUP BY u.tier
    `).all() as any[];

    res.json({
      dailyOrders,
      topBakers: topBakers.map((b: any) => ({
        id: b.id,
        name: b.name,
        bakeryName: b.bakery_name,
        tier: b.tier,
        orderCount: b.order_count,
        revenue: b.revenue,
      })),
      topProducts: topProducts.map((p: any) => ({
        name: p.name,
        category: p.category,
        bakeryName: p.bakery_name,
        timesOrdered: p.times_ordered,
        revenue: p.revenue,
      })),
      tierFunnel,
      avgRevenueByTier,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
