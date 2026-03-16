import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { requireTier } from '../middleware/tierGuard.js';

const router = Router();

// GET all wholesale accounts
router.get('/accounts', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const accounts = db
      .prepare(`
        SELECT * FROM wholesale_accounts
        WHERE user_id = ?
        ORDER BY company_name
      `)
      .all(req.userId) as any[];

    const result = accounts.map((a) => ({
      id: a.id,
      companyName: a.company_name,
      contactName: a.contact_name,
      email: a.email,
      phone: a.phone,
      address: a.address,
      discountPercent: a.discount_percent,
      paymentTerms: a.payment_terms,
      isActive: a.is_active,
      createdAt: a.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wholesale accounts' });
  }
});

// GET single wholesale account with orders
router.get('/accounts/:id', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const account = db.prepare('SELECT * FROM wholesale_accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!account) {
      res.status(404).json({ error: 'Wholesale account not found' });
      return;
    }

    const orders = db
      .prepare(
        `
        SELECT * FROM wholesale_orders
        WHERE wholesale_account_id = ? AND user_id = ?
        ORDER BY created_at DESC
      `
      )
      .all(req.params.id, req.userId) as any[];

    res.json({
      id: account.id,
      companyName: account.company_name,
      contactName: account.contact_name,
      email: account.email,
      phone: account.phone,
      address: account.address,
      discountPercent: account.discount_percent,
      paymentTerms: account.payment_terms,
      isActive: account.is_active,
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: o.total_amount,
        deliveryDate: o.delivery_date,
        createdAt: o.created_at,
      })),
      createdAt: account.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wholesale account' });
  }
});

// CREATE wholesale account
router.post('/accounts', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const { companyName, contactName, email, phone, address, discountPercent, paymentTerms } = req.body;

  if (!companyName || !contactName) {
    res.status(400).json({ error: 'Company name and contact name are required' });
    return;
  }

  const db = getDatabase();

  try {
    const accountId = uuidv4();

    db.prepare(`
      INSERT INTO wholesale_accounts (id, user_id, company_name, contact_name, email, phone, address, discount_percent, payment_terms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      accountId,
      req.userId,
      companyName,
      contactName,
      email || null,
      phone || null,
      address || null,
      discountPercent || 0,
      paymentTerms || null,
      new Date().toISOString()
    );

    res.status(201).json({
      id: accountId,
      companyName,
      contactName,
      email,
      phone,
      address,
      discountPercent,
      paymentTerms,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wholesale account' });
  }
});

// UPDATE wholesale account
router.put('/accounts/:id', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const { companyName, contactName, email, phone, address, discountPercent, paymentTerms, isActive } = req.body;
  const db = getDatabase();

  try {
    const account = db.prepare('SELECT * FROM wholesale_accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!account) {
      res.status(404).json({ error: 'Wholesale account not found' });
      return;
    }

    db.prepare(`
      UPDATE wholesale_accounts
      SET company_name = ?, contact_name = ?, email = ?, phone = ?, address = ?, discount_percent = ?, payment_terms = ?, is_active = ?
      WHERE id = ?
    `).run(
      companyName || account.company_name,
      contactName || account.contact_name,
      email !== undefined ? email : account.email,
      phone !== undefined ? phone : account.phone,
      address !== undefined ? address : account.address,
      discountPercent !== undefined ? discountPercent : account.discount_percent,
      paymentTerms !== undefined ? paymentTerms : account.payment_terms,
      isActive !== undefined ? (isActive ? 1 : 0) : account.is_active,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM wholesale_accounts WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      companyName: updated.company_name,
      contactName: updated.contact_name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      discountPercent: updated.discount_percent,
      paymentTerms: updated.payment_terms,
      isActive: updated.is_active,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wholesale account' });
  }
});

// DELETE wholesale account
router.delete('/accounts/:id', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const account = db.prepare('SELECT * FROM wholesale_accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!account) {
      res.status(404).json({ error: 'Wholesale account not found' });
      return;
    }

    db.prepare('DELETE FROM wholesale_accounts WHERE id = ?').run(req.params.id);

    res.json({ message: 'Wholesale account deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete wholesale account' });
  }
});

// GET wholesale orders
router.get('/orders', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const db = getDatabase();
  const status = (req.query.status as string) || null;

  try {
    let query = `
      SELECT wo.*, wa.company_name
      FROM wholesale_orders wo
      JOIN wholesale_accounts wa ON wo.wholesale_account_id = wa.id
      WHERE wo.user_id = ?
    `;
    const params: any[] = [req.userId];

    if (status) {
      query += ` AND wo.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY wo.created_at DESC`;

    const orders = db.prepare(query).all(...params) as any[];

    const result = orders.map((o) => ({
      id: o.id,
      wholesaleAccountId: o.wholesale_account_id,
      companyName: o.company_name,
      status: o.status,
      totalAmount: o.total_amount,
      deliveryDate: o.delivery_date,
      notes: o.notes,
      createdAt: o.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wholesale orders' });
  }
});

// GET single wholesale order
router.get('/orders/:id', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const order = db.prepare('SELECT * FROM wholesale_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Wholesale order not found' });
      return;
    }

    const account = db.prepare('SELECT * FROM wholesale_accounts WHERE id = ?').get(order.wholesale_account_id) as any;

    res.json({
      id: order.id,
      account: {
        id: account.id,
        companyName: account.company_name,
        contactName: account.contact_name,
        email: account.email,
        phone: account.phone,
      },
      status: order.status,
      totalAmount: order.total_amount,
      deliveryDate: order.delivery_date,
      notes: order.notes,
      createdAt: order.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wholesale order' });
  }
});

// CREATE wholesale order
router.post('/orders', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const { wholesaleAccountId, deliveryDate, notes } = req.body;

  if (!wholesaleAccountId) {
    res.status(400).json({ error: 'Wholesale account ID is required' });
    return;
  }

  const db = getDatabase();

  try {
    // Verify account exists
    const account = db.prepare('SELECT * FROM wholesale_accounts WHERE id = ? AND user_id = ?').get(wholesaleAccountId, req.userId) as any;

    if (!account) {
      res.status(404).json({ error: 'Wholesale account not found' });
      return;
    }

    const orderId = uuidv4();

    db.prepare(`
      INSERT INTO wholesale_orders (id, wholesale_account_id, user_id, status, total_amount, delivery_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, wholesaleAccountId, req.userId, 'pending', 0, deliveryDate || null, notes || null, new Date().toISOString());

    res.status(201).json({
      id: orderId,
      wholesaleAccountId,
      status: 'pending',
      totalAmount: 0,
      deliveryDate,
      notes,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wholesale order' });
  }
});

// UPDATE wholesale order
router.put('/orders/:id', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const { status, deliveryDate, notes } = req.body;
  const db = getDatabase();

  try {
    const order = db.prepare('SELECT * FROM wholesale_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Wholesale order not found' });
      return;
    }

    db.prepare(`
      UPDATE wholesale_orders
      SET status = ?, delivery_date = ?, notes = ?
      WHERE id = ?
    `).run(status || order.status, deliveryDate !== undefined ? deliveryDate : order.delivery_date, notes !== undefined ? notes : order.notes, req.params.id);

    const updated = db.prepare('SELECT * FROM wholesale_orders WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      status: updated.status,
      totalAmount: updated.total_amount,
      deliveryDate: updated.delivery_date,
      notes: updated.notes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wholesale order' });
  }
});

// DELETE wholesale order
router.delete('/orders/:id', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const order = db.prepare('SELECT * FROM wholesale_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Wholesale order not found' });
      return;
    }

    db.prepare('DELETE FROM wholesale_orders WHERE id = ?').run(req.params.id);

    res.json({ message: 'Wholesale order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete wholesale order' });
  }
});

// GET wholesale statistics
router.get('/stats/summary', authenticateToken, requireTier('pro'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const totalAccounts = db.prepare('SELECT COUNT(*) as count FROM wholesale_accounts WHERE user_id = ?').get(req.userId) as any;

    const activeAccounts = db.prepare('SELECT COUNT(*) as count FROM wholesale_accounts WHERE user_id = ? AND is_active = 1').get(req.userId) as any;

    const totalWholesaleRevenue = db
      .prepare(
        `
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM wholesale_orders
        WHERE user_id = ? AND status != 'cancelled'
      `
      )
      .get(req.userId) as any;

    const averageOrderValue = db
      .prepare(`
        SELECT COALESCE(AVG(total_amount), 0) as avg
        FROM wholesale_orders
        WHERE user_id = ? AND status != 'cancelled'
      `)
      .get(req.userId) as any;

    res.json({
      totalAccounts: totalAccounts.count,
      activeAccounts: activeAccounts.count,
      totalWholesaleRevenue: totalWholesaleRevenue.total,
      averageOrderValue: averageOrderValue.avg,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wholesale statistics' });
  }
});

export default router;
