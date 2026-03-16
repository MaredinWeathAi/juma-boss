import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all customers
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const customers = db
      .prepare(`
        SELECT * FROM customers
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .all(req.userId) as any[];

    const result = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      birthday: c.birthday,
      isCorporate: c.is_corporate,
      companyName: c.company_name,
      totalOrders: c.total_orders,
      totalSpent: c.total_spent,
      createdAt: c.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET single customer with order history
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const orders = db
      .prepare(
        `
        SELECT o.* FROM orders o
        WHERE o.customer_id = ? AND o.user_id = ?
        ORDER BY o.created_at DESC
      `
      )
      .all(req.params.id, req.userId) as any[];

    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      birthday: customer.birthday,
      notes: customer.notes,
      isCorporate: customer.is_corporate,
      companyName: customer.company_name,
      totalOrders: customer.total_orders,
      totalSpent: customer.total_spent,
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: o.total_amount,
        deliveryDate: o.delivery_date,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
      })),
      createdAt: customer.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// CREATE customer
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { name, email, phone, address, birthday, notes, isCorporate, companyName } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  const db = getDatabase();

  try {
    const customerId = uuidv4();

    db.prepare(`
      INSERT INTO customers (id, user_id, name, email, phone, address, birthday, notes, is_corporate, company_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customerId,
      req.userId,
      name,
      email || null,
      phone || null,
      address || null,
      birthday || null,
      notes || null,
      isCorporate ? 1 : 0,
      companyName || null,
      new Date().toISOString()
    );

    res.status(201).json({
      id: customerId,
      name,
      email,
      phone,
      address,
      birthday,
      notes,
      isCorporate,
      companyName,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// UPDATE customer
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { name, email, phone, address, birthday, notes, isCorporate, companyName } = req.body;
  const db = getDatabase();

  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    db.prepare(`
      UPDATE customers
      SET name = ?, email = ?, phone = ?, address = ?, birthday = ?, notes = ?, is_corporate = ?, company_name = ?
      WHERE id = ?
    `).run(
      name || customer.name,
      email !== undefined ? email : customer.email,
      phone !== undefined ? phone : customer.phone,
      address !== undefined ? address : customer.address,
      birthday !== undefined ? birthday : customer.birthday,
      notes !== undefined ? notes : customer.notes,
      isCorporate !== undefined ? (isCorporate ? 1 : 0) : customer.is_corporate,
      companyName !== undefined ? companyName : customer.company_name,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      birthday: updated.birthday,
      notes: updated.notes,
      isCorporate: updated.is_corporate,
      companyName: updated.company_name,
      totalOrders: updated.total_orders,
      totalSpent: updated.total_spent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);

    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
