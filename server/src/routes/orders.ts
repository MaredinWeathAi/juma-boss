import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all orders
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();
  const status = (req.query.status as string) || null;

  try {
    let query = `
      SELECT o.*, c.name as customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.user_id = ?
    `;
    const params: any[] = [req.userId];

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const orders = db.prepare(query).all(...params) as any[];

    const result = orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number || `ORD-${o.id.slice(0, 8).toUpperCase()}`,
      customerId: o.customer_id,
      customerName: o.customer_name,
      status: o.status,
      total: o.total_amount,
      totalAmount: o.total_amount,
      notes: o.notes,
      deliveryDate: o.delivery_date,
      deliveryTime: o.delivery_time,
      deliveryType: o.delivery_type,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order with items
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const order = db
      .prepare(
        `
        SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ? AND o.user_id = ?
      `
      )
      .get(req.params.id, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const items = db
      .prepare(
        `
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `
      )
      .all(req.params.id) as any[];

    res.json({
      id: order.id,
      customerId: order.customer_id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      status: order.status,
      totalAmount: order.total_amount,
      notes: order.notes,
      deliveryDate: order.delivery_date,
      deliveryTime: order.delivery_time,
      deliveryType: order.delivery_type,
      paymentStatus: order.payment_status,
      items: items.map((i) => ({
        id: i.id,
        productId: i.product_id,
        productName: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        notes: i.notes,
        totalPrice: i.quantity * i.unit_price,
      })),
      createdAt: order.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// CREATE order
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { customerId, items, deliveryDate, deliveryTime, deliveryType, paymentStatus, notes } = req.body;

  if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Customer ID and items are required' });
    return;
  }

  const db = getDatabase();

  try {
    // Verify customer belongs to user
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND user_id = ?').get(customerId, req.userId) as any;

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Calculate total amount
    let totalAmount = 0;
    const itemIds: string[] = [];

    db.transaction(() => {
      const orderId = uuidv4();

      // Create order
      db.prepare(`
        INSERT INTO orders (id, user_id, customer_id, status, total_amount, delivery_date, delivery_time, delivery_type, payment_status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        req.userId,
        customerId,
        'pending',
        0,
        deliveryDate || null,
        deliveryTime || null,
        deliveryType || 'pickup',
        paymentStatus || 'unpaid',
        notes || null,
        new Date().toISOString()
      );

      // Add items
      items.forEach((item: any) => {
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(item.productId, req.userId) as any;

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const itemId = uuidv4();
        const unitPrice = item.unitPrice || product.base_price;
        const itemTotal = unitPrice * item.quantity;

        totalAmount += itemTotal;

        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(itemId, orderId, item.productId, item.quantity, unitPrice, item.notes || null);

        itemIds.push(itemId);
      });

      // Update order with total amount
      db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(totalAmount, orderId);

      // Update customer stats
      const orderCount = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_id = ? AND status != ?').get(customerId, 'cancelled') as any).count;
      db.prepare('UPDATE customers SET total_orders = ?, total_spent = total_spent + ? WHERE id = ?').run(orderCount, totalAmount, customerId);

      return orderId;
    })();

    const createdOrder = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.userId) as any;

    res.status(201).json({
      id: createdOrder.id,
      customerId,
      status: createdOrder.status,
      totalAmount,
      deliveryDate,
      deliveryTime,
      deliveryType,
      paymentStatus,
      notes,
      items: items.map((item: any, idx: number) => ({
        id: itemIds[idx],
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      createdAt: createdOrder.created_at,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// UPDATE order
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { status, paymentStatus, deliveryDate, deliveryTime, notes } = req.body;
  const db = getDatabase();

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    db.prepare(`
      UPDATE orders
      SET status = ?, payment_status = ?, delivery_date = ?, delivery_time = ?, notes = ?
      WHERE id = ?
    `).run(
      status || order.status,
      paymentStatus || order.payment_status,
      deliveryDate !== undefined ? deliveryDate : order.delivery_date,
      deliveryTime !== undefined ? deliveryTime : order.delivery_time,
      notes !== undefined ? notes : order.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      status: updated.status,
      totalAmount: updated.total_amount,
      paymentStatus: updated.payment_status,
      deliveryDate: updated.delivery_date,
      deliveryTime: updated.delivery_time,
      notes: updated.notes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE order
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);

    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Add item to order
router.post('/:id/items', authenticateToken, (req: AuthRequest, res) => {
  const { productId, quantity, unitPrice, notes } = req.body;
  const db = getDatabase();

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(productId, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const itemId = uuidv4();
    const price = unitPrice || product.base_price;
    const itemTotal = price * quantity;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(itemId, req.params.id, productId, quantity, price, notes || null);

      db.prepare('UPDATE orders SET total_amount = total_amount + ? WHERE id = ?').run(itemTotal, req.params.id);
    })();

    res.status(201).json({
      id: itemId,
      productId,
      quantity,
      unitPrice: price,
      notes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Remove item from order
router.delete('/:id/items/:itemId', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const item = db.prepare('SELECT * FROM order_items WHERE id = ?').get(req.params.itemId) as any;

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    db.transaction(() => {
      const itemTotal = item.quantity * item.unit_price;
      db.prepare('UPDATE orders SET total_amount = total_amount - ? WHERE id = ?').run(itemTotal, req.params.id);
      db.prepare('DELETE FROM order_items WHERE id = ?').run(req.params.itemId);
    })();

    res.json({ message: 'Item removed from order' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

export default router;
