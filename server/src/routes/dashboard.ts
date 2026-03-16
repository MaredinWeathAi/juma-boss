import { Router } from 'express';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET dashboard stats
router.get('/stats', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Total revenue (all time)
    const totalRevenueResult = db
      .prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE user_id = ? AND status != 'cancelled'
      `)
      .get(req.userId) as any;

    // Revenue today
    const revenueTodayResult = db
      .prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE user_id = ? AND status = 'delivered' AND DATE(created_at) = ?
      `)
      .get(req.userId, today) as any;

    // Orders today
    const ordersCountTodayResult = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE user_id = ? AND DATE(created_at) = ?
      `)
      .get(req.userId, today) as any;

    // Pending orders
    const pendingOrdersResult = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE user_id = ? AND status IN ('pending', 'confirmed', 'in_production')
      `)
      .get(req.userId) as any;

    // Total customers
    const totalCustomersResult = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM customers
        WHERE user_id = ?
      `)
      .get(req.userId) as any;

    // Monthly revenue
    const monthlyRevenueResult = db
      .prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE user_id = ? AND status != 'cancelled' AND created_at >= ?
      `)
      .get(req.userId, thirtyDaysAgo) as any;

    res.json({
      totalRevenue: totalRevenueResult.total,
      revenueTodayAmount: revenueTodayResult.total,
      ordersToday: ordersCountTodayResult.count,
      pendingOrders: pendingOrdersResult.count,
      totalCustomers: totalCustomersResult.count,
      monthlyRevenue: monthlyRevenueResult.total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET recent orders
router.get('/recent-orders', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const orders = db
      .prepare(`
        SELECT o.*, c.name as customer_name
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        LIMIT 10
      `)
      .all(req.userId) as any[];

    const result = orders.map((o) => ({
      id: o.id,
      customerName: o.customer_name,
      status: o.status,
      totalAmount: o.total_amount,
      createdAt: o.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// GET revenue chart (last 30 days)
router.get('/revenue-chart', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const revenueByDate = db
      .prepare(`
        SELECT
          DATE(created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE user_id = ? AND status != 'cancelled' AND created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)
      .all(req.userId, thirtyDaysAgo.toISOString()) as any[];

    // Fill in missing dates with 0
    const chartData = [];
    const dates = new Set<string>();

    revenueByDate.forEach((r) => {
      dates.add(r.date);
    });

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = revenueByDate.find((r) => r.date === dateStr);
      chartData.push({
        date: dateStr,
        revenue: dayData?.revenue || 0,
      });
    }

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue chart' });
  }
});

// GET top products by revenue
router.get('/top-products', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const topProducts = db
      .prepare(`
        SELECT
          p.id,
          p.name,
          COUNT(oi.id) as order_count,
          COALESCE(SUM(oi.quantity), 0) as total_quantity,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.user_id = ? AND (o.status != 'cancelled' OR o.status IS NULL)
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC
        LIMIT 10
      `)
      .all(req.userId) as any[];

    const result = topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      orderCount: p.order_count,
      totalQuantity: p.total_quantity,
      totalRevenue: p.total_revenue,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

// GET order status breakdown
router.get('/orders-by-status', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const statusBreakdown = db
      .prepare(`
        SELECT
          status,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE user_id = ?
        GROUP BY status
      `)
      .all(req.userId) as any[];

    const result = statusBreakdown.map((s) => ({
      status: s.status,
      count: s.count,
      revenue: s.revenue,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order breakdown' });
  }
});

// GET customer insights
router.get('/customer-insights', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ?').get(req.userId) as any;

    const corporateCustomers = db
      .prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ? AND is_corporate = 1')
      .get(req.userId) as any;

    const avgOrderValue = db
      .prepare(
        `
        SELECT COALESCE(AVG(total_amount), 0) as avg
        FROM orders
        WHERE user_id = ? AND status != 'cancelled'
      `
      )
      .get(req.userId) as any;

    const repeatCustomers = db
      .prepare(`
        SELECT COUNT(DISTINCT customer_id) as count
        FROM orders
        WHERE user_id = ? AND customer_id IN (
          SELECT customer_id FROM orders WHERE user_id = ? GROUP BY customer_id HAVING COUNT(*) > 1
        )
      `)
      .get(req.userId, req.userId) as any;

    res.json({
      totalCustomers: totalCustomers.count,
      corporateCustomers: corporateCustomers.count,
      averageOrderValue: avgOrderValue.avg,
      repeatCustomers: repeatCustomers.count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer insights' });
  }
});

export default router;
