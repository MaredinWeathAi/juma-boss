import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { requireTier } from '../middleware/tierGuard.js';

const router = Router();

// GET production schedule by date
router.get('/schedule/:date', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const db = getDatabase();
  const { date } = req.params;

  try {
    const tasks = db
      .prepare(`
        SELECT
          pt.*,
          p.name as product_name,
          p.prep_time_minutes,
          o.id as order_id,
          c.name as customer_name
        FROM production_tasks pt
        JOIN products p ON pt.product_id = p.id
        LEFT JOIN orders o ON pt.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE pt.user_id = ? AND pt.scheduled_date = ?
        ORDER BY pt.start_time ASC
      `)
      .all(req.userId, date) as any[];

    const result = tasks.map((t) => ({
      id: t.id,
      productId: t.product_id,
      productName: t.product_name,
      orderId: t.order_id,
      customerName: t.customer_name,
      status: t.status,
      scheduledDate: t.scheduled_date,
      startTime: t.start_time,
      endTime: t.end_time,
      prepTimeMinutes: t.prep_time_minutes,
      assignedTo: t.assigned_to,
      notes: t.notes,
      createdAt: t.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production schedule' });
  }
});

// GET all production tasks
router.get('/', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const db = getDatabase();
  const status = (req.query.status as string) || null;

  try {
    let query = `
      SELECT
        pt.*,
        p.name as product_name,
        p.prep_time_minutes,
        o.id as order_id,
        c.name as customer_name
      FROM production_tasks pt
      JOIN products p ON pt.product_id = p.id
      LEFT JOIN orders o ON pt.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE pt.user_id = ?
    `;
    const params: any[] = [req.userId];

    if (status) {
      query += ` AND pt.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pt.scheduled_date ASC, pt.start_time ASC`;

    const tasks = db.prepare(query).all(...params) as any[];

    const result = tasks.map((t) => ({
      id: t.id,
      productId: t.product_id,
      productName: t.product_name,
      orderId: t.order_id,
      customerName: t.customer_name,
      status: t.status,
      scheduledDate: t.scheduled_date,
      startTime: t.start_time,
      endTime: t.end_time,
      prepTimeMinutes: t.prep_time_minutes,
      assignedTo: t.assigned_to,
      notes: t.notes,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production tasks' });
  }
});

// GET single production task
router.get('/:id', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const task = db
      .prepare(`
        SELECT
          pt.*,
          p.name as product_name,
          p.description as product_description,
          p.prep_time_minutes,
          o.id as order_id,
          c.name as customer_name
        FROM production_tasks pt
        JOIN products p ON pt.product_id = p.id
        LEFT JOIN orders o ON pt.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE pt.id = ? AND pt.user_id = ?
      `)
      .get(req.params.id, req.userId) as any;

    if (!task) {
      res.status(404).json({ error: 'Production task not found' });
      return;
    }

    // Get recipe ingredients
    const recipe = db.prepare('SELECT id FROM recipes WHERE product_id = ?').get(task.product_id) as any;
    let ingredients: any[] = [];

    if (recipe) {
      ingredients = db
        .prepare(`
          SELECT ri.*, i.name, i.unit
          FROM recipe_ingredients ri
          JOIN ingredients i ON ri.ingredient_id = i.id
          WHERE ri.recipe_id = ?
        `)
        .all(recipe.id) as any[];
    }

    res.json({
      id: task.id,
      productId: task.product_id,
      productName: task.product_name,
      productDescription: task.product_description,
      orderId: task.order_id,
      customerName: task.customer_name,
      status: task.status,
      scheduledDate: task.scheduled_date,
      startTime: task.start_time,
      endTime: task.end_time,
      prepTimeMinutes: task.prep_time_minutes,
      assignedTo: task.assigned_to,
      notes: task.notes,
      ingredients: ingredients.map((i) => ({
        id: i.ingredient_id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production task' });
  }
});

// CREATE production task
router.post('/', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const { productId, orderId, scheduledDate, startTime, endTime, assignedTo, notes } = req.body;

  if (!productId || !scheduledDate) {
    res.status(400).json({ error: 'Product ID and scheduled date are required' });
    return;
  }

  const db = getDatabase();

  try {
    // Verify product exists
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(productId, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Verify order if provided
    if (orderId) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.userId) as any;

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
    }

    const taskId = uuidv4();

    db.prepare(`
      INSERT INTO production_tasks (id, user_id, order_id, product_id, status, scheduled_date, start_time, end_time, assigned_to, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      req.userId,
      orderId || null,
      productId,
      'pending',
      scheduledDate,
      startTime || null,
      endTime || null,
      assignedTo || null,
      notes || null,
      new Date().toISOString()
    );

    res.status(201).json({
      id: taskId,
      productId,
      orderId,
      scheduledDate,
      startTime,
      endTime,
      assignedTo,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create production task' });
  }
});

// UPDATE production task
router.put('/:id', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const { status, startTime, endTime, assignedTo, notes } = req.body;
  const db = getDatabase();

  try {
    const task = db.prepare('SELECT * FROM production_tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!task) {
      res.status(404).json({ error: 'Production task not found' });
      return;
    }

    db.prepare(`
      UPDATE production_tasks
      SET status = ?, start_time = ?, end_time = ?, assigned_to = ?, notes = ?
      WHERE id = ?
    `).run(
      status || task.status,
      startTime !== undefined ? startTime : task.start_time,
      endTime !== undefined ? endTime : task.end_time,
      assignedTo !== undefined ? assignedTo : task.assigned_to,
      notes !== undefined ? notes : task.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM production_tasks WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      status: updated.status,
      startTime: updated.start_time,
      endTime: updated.end_time,
      assignedTo: updated.assigned_to,
      notes: updated.notes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update production task' });
  }
});

// DELETE production task
router.delete('/:id', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const task = db.prepare('SELECT * FROM production_tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!task) {
      res.status(404).json({ error: 'Production task not found' });
      return;
    }

    db.prepare('DELETE FROM production_tasks WHERE id = ?').run(req.params.id);

    res.json({ message: 'Production task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete production task' });
  }
});

// Auto-generate production tasks from orders (for pending/confirmed orders)
router.post('/auto-generate/:orderId', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.orderId, req.userId) as any;

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      res.status(400).json({ error: 'Cannot generate tasks for completed or cancelled orders' });
      return;
    }

    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.orderId) as any[];

    const createdTasks: any[] = [];

    db.transaction(() => {
      orderItems.forEach((item) => {
        // Check if task already exists
        const existing = db.prepare('SELECT id FROM production_tasks WHERE order_id = ? AND product_id = ?').get(req.params.orderId, item.product_id) as any;

        if (!existing) {
          const taskId = uuidv4();

          db.prepare(`
            INSERT INTO production_tasks (id, user_id, order_id, product_id, status, scheduled_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            taskId,
            req.userId,
            req.params.orderId,
            item.product_id,
            'pending',
            order.delivery_date,
            new Date().toISOString()
          );

          createdTasks.push({
            id: taskId,
            productId: item.product_id,
            quantity: item.quantity,
          });
        }
      });
    })();

    res.status(201).json({
      message: `Created ${createdTasks.length} production tasks`,
      tasks: createdTasks,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to auto-generate production tasks' });
  }
});

export default router;
