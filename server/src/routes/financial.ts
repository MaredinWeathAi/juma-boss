import { Router } from 'express';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET financial summary
router.get('/summary', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();
  const period = (req.query.period as string) || 'all'; // all, month, quarter, year

  try {
    let dateFilter = '';
    const now = new Date();
    let startDate = '';

    if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = monthAgo.toISOString();
      dateFilter = ` AND o.created_at >= ?`;
    } else if (period === 'quarter') {
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      startDate = quarterAgo.toISOString();
      dateFilter = ` AND o.created_at >= ?`;
    } else if (period === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      startDate = yearAgo.toISOString();
      dateFilter = ` AND o.created_at >= ?`;
    }

    const params: any[] = [req.userId];
    if (startDate) {
      params.push(startDate);
    }

    // Total revenue
    const revenue = db
      .prepare(
        `
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE user_id = ? AND status != 'cancelled'${dateFilter}
      `
      )
      .get(...params) as any;

    // Total cost of goods sold
    const cogs = db
      .prepare(
        `
        SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0) as total
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ? AND o.status != 'cancelled'${dateFilter}
      `
      )
      .get(...params) as any;

    // Gross profit
    const grossProfit = revenue.total - cogs.total;
    const grossMargin = revenue.total > 0 ? ((grossProfit / revenue.total) * 100).toFixed(2) : 0;

    // Operating expenses (payroll)
    const payroll = db
      .prepare(
        `
        SELECT COALESCE(SUM(s.end_time IS NOT NULL AND s.start_time IS NOT NULL
          ? (CAST(substr(s.end_time, 1, 2) AS INTEGER) - CAST(substr(s.start_time, 1, 2) AS INTEGER)) * e.hourly_rate
          : 0), 0) as total
        FROM shifts s
        JOIN employees e ON s.employee_id = e.id
        WHERE e.user_id = ?${dateFilter}
      `
      )
      .get(...params) as any;

    // Total orders
    const orderCount = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM orders
        WHERE user_id = ? AND status != 'cancelled'${dateFilter}
      `
      )
      .get(...params) as any;

    // Paid orders
    const paidCount = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM orders
        WHERE user_id = ? AND payment_status = 'paid'${dateFilter}
      `
      )
      .get(...params) as any;

    // Outstanding amount
    const outstanding = db
      .prepare(
        `
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE user_id = ? AND payment_status = 'unpaid'${dateFilter}
      `
      )
      .get(...params) as any;

    const netProfit = grossProfit - payroll.total;
    const netMargin = revenue.total > 0 ? ((netProfit / revenue.total) * 100).toFixed(2) : 0;

    res.json({
      period,
      revenue: Number(revenue.total.toFixed(2)),
      cogs: Number(cogs.total.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossMargin: Number(grossMargin),
      payroll: Number(payroll.total.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      netMargin: Number(netMargin),
      orderCount: orderCount.count,
      paidCount: paidCount.count,
      outstandingAmount: Number(outstanding.total.toFixed(2)),
      averageOrderValue: orderCount.count > 0 ? Number((revenue.total / orderCount.count).toFixed(2)) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// GET product profitability analysis
router.get('/product-profitability', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const products = db
      .prepare(`
        SELECT
          p.id,
          p.name,
          p.category,
          p.base_price,
          p.cost_price,
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN oi.quantity ELSE 0 END), 0) as units_sold,
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN oi.quantity * oi.unit_price ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN oi.quantity * p.cost_price ELSE 0 END), 0) as total_cogs,
          COUNT(DISTINCT CASE WHEN o.status != 'cancelled' THEN oi.order_id ELSE NULL END) as times_ordered
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.user_id = ?
        GROUP BY p.id, p.name, p.category, p.base_price, p.cost_price
        ORDER BY total_revenue DESC
      `)
      .all(req.userId) as any[];

    const result = products.map((p) => {
      const profit = p.total_revenue - p.total_cogs;
      const profitMargin = p.total_revenue > 0 ? ((profit / p.total_revenue) * 100).toFixed(2) : 0;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        basePrice: p.base_price,
        costPrice: p.cost_price,
        unitsSold: p.units_sold,
        totalRevenue: Number(p.total_revenue.toFixed(2)),
        totalCogs: Number(p.total_cogs.toFixed(2)),
        totalProfit: Number(profit.toFixed(2)),
        profitMargin: Number(profitMargin),
        timesOrdered: p.times_ordered,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product profitability' });
  }
});

// GET cash flow projection
router.get('/cash-flow', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    // Get last 30 days of data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Daily revenue and expenses
    const dailyData = db
      .prepare(`
        SELECT
          DATE(o.created_at) as date,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as daily_revenue,
          COALESCE(SUM(oi.quantity * p.cost_price), 0) as daily_cogs
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ? AND o.created_at >= ?
        GROUP BY DATE(o.created_at)
        ORDER BY date ASC
      `)
      .all(req.userId, thirtyDaysAgo.toISOString()) as any[];

    // Payroll expenses
    const payrollData = db
      .prepare(`
        SELECT
          DATE(date) as date,
          COALESCE(SUM(
            CASE WHEN end_time IS NOT NULL
            THEN (CAST(substr(end_time, 1, 2) AS INTEGER) - CAST(substr(start_time, 1, 2) AS INTEGER)) * e.hourly_rate
            ELSE 0 END
          ), 0) as payroll
        FROM shifts s
        JOIN employees e ON s.employee_id = e.id
        WHERE e.user_id = ? AND date >= ?
        GROUP BY DATE(date)
      `)
      .all(req.userId, thirtyDaysAgo.toISOString()) as any[];

    const payrollMap = new Map<string, number>();
    payrollData.forEach((p) => {
      payrollMap.set(p.date, p.payroll);
    });

    const cashFlow = dailyData.map((d) => {
      const payroll = payrollMap.get(d.date) || 0;
      const netCashFlow = d.daily_revenue - d.daily_cogs - payroll;

      return {
        date: d.date,
        revenue: Number(d.daily_revenue.toFixed(2)),
        cogs: Number(d.daily_cogs.toFixed(2)),
        payroll: Number(payroll.toFixed(2)),
        netCashFlow: Number(netCashFlow.toFixed(2)),
      };
    });

    res.json(cashFlow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cash flow' });
  }
});

// GET payment status breakdown
router.get('/payment-breakdown', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const breakdown = db
      .prepare(`
        SELECT
          payment_status,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total_amount
        FROM orders
        WHERE user_id = ? AND status != 'cancelled'
        GROUP BY payment_status
      `)
      .all(req.userId) as any[];

    const result = breakdown.map((b) => ({
      status: b.payment_status,
      count: b.count,
      amount: Number(b.total_amount.toFixed(2)),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment breakdown' });
  }
});

// GET category profitability
router.get('/category-analysis', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const analysis = db
      .prepare(`
        SELECT
          p.category,
          COUNT(DISTINCT p.id) as product_count,
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN oi.quantity ELSE 0 END), 0) as units_sold,
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN oi.quantity * oi.unit_price ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN oi.quantity * p.cost_price ELSE 0 END), 0) as total_cogs
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.user_id = ?
        GROUP BY p.category
        ORDER BY total_revenue DESC
      `)
      .all(req.userId) as any[];

    const result = analysis.map((a) => {
      const profit = a.total_revenue - a.total_cogs;
      const profitMargin = a.total_revenue > 0 ? ((profit / a.total_revenue) * 100).toFixed(2) : 0;

      return {
        category: a.category,
        productCount: a.product_count,
        unitsSold: a.units_sold,
        totalRevenue: Number(a.total_revenue.toFixed(2)),
        totalCogs: Number(a.total_cogs.toFixed(2)),
        totalProfit: Number(profit.toFixed(2)),
        profitMargin: Number(profitMargin),
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category analysis' });
  }
});

export default router;
