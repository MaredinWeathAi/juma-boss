import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all employees
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const employees = db
      .prepare(`
        SELECT * FROM employees
        WHERE user_id = ?
        ORDER BY name
      `)
      .all(req.userId) as any[];

    const result = employees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      role: e.role,
      hourlyRate: e.hourly_rate,
      isActive: e.is_active,
      createdAt: e.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET single employee with shifts
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    const shifts = db
      .prepare(
        `
        SELECT * FROM shifts
        WHERE employee_id = ? AND user_id = ?
        ORDER BY date DESC
        LIMIT 30
      `
      )
      .all(req.params.id, req.userId) as any[];

    res.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      hourlyRate: employee.hourly_rate,
      isActive: employee.is_active,
      shifts: shifts.map((s) => ({
        id: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        notes: s.notes,
      })),
      createdAt: employee.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// CREATE employee
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { name, email, phone, role, hourlyRate } = req.body;

  if (!name || !role) {
    res.status(400).json({ error: 'Name and role are required' });
    return;
  }

  const db = getDatabase();

  try {
    const employeeId = uuidv4();

    db.prepare(`
      INSERT INTO employees (id, user_id, name, email, phone, role, hourly_rate, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      employeeId,
      req.userId,
      name,
      email || null,
      phone || null,
      role,
      hourlyRate || null,
      1,
      new Date().toISOString()
    );

    res.status(201).json({
      id: employeeId,
      name,
      email,
      phone,
      role,
      hourlyRate,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// UPDATE employee
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { name, email, phone, role, hourlyRate, isActive } = req.body;
  const db = getDatabase();

  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    db.prepare(`
      UPDATE employees
      SET name = ?, email = ?, phone = ?, role = ?, hourly_rate = ?, is_active = ?
      WHERE id = ?
    `).run(
      name || employee.name,
      email !== undefined ? email : employee.email,
      phone !== undefined ? phone : employee.phone,
      role || employee.role,
      hourlyRate !== undefined ? hourlyRate : employee.hourly_rate,
      isActive !== undefined ? (isActive ? 1 : 0) : employee.is_active,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      hourlyRate: updated.hourly_rate,
      isActive: updated.is_active,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE employee
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);

    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// GET employee shifts
router.get('/:id/shifts', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();
  const fromDate = (req.query.from as string) || null;
  const toDate = (req.query.to as string) || null;

  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    let query = `
      SELECT * FROM shifts
      WHERE employee_id = ? AND user_id = ?
    `;
    const params: any[] = [req.params.id, req.userId];

    if (fromDate) {
      query += ` AND date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY date DESC`;

    const shifts = db.prepare(query).all(...params) as any[];

    res.json(
      shifts.map((s) => ({
        id: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        notes: s.notes,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee shifts' });
  }
});

// CREATE shift
router.post('/:id/shifts', authenticateToken, (req: AuthRequest, res) => {
  const { date, startTime, endTime, notes } = req.body;

  if (!date || !startTime || !endTime) {
    res.status(400).json({ error: 'Date, start time, and end time are required' });
    return;
  }

  const db = getDatabase();

  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    const shiftId = uuidv4();

    db.prepare(`
      INSERT INTO shifts (id, employee_id, user_id, date, start_time, end_time, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(shiftId, req.params.id, req.userId, date, startTime, endTime, notes || null);

    res.status(201).json({
      id: shiftId,
      date,
      startTime,
      endTime,
      notes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

// DELETE shift
router.delete('/:id/shifts/:shiftId', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const shift = db.prepare('SELECT * FROM shifts WHERE id = ? AND user_id = ?').get(req.params.shiftId, req.userId) as any;

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    db.prepare('DELETE FROM shifts WHERE id = ?').run(req.params.shiftId);

    res.json({ message: 'Shift deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

// GET payroll summary
router.get('/payroll/summary', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();
  const fromDate = (req.query.from as string) || null;
  const toDate = (req.query.to as string) || null;

  try {
    let query = `
      SELECT
        e.id,
        e.name,
        e.hourly_rate,
        COUNT(s.id) as total_shifts,
        COALESCE(SUM(
          CASE
            WHEN s.end_time IS NOT NULL
            THEN (CAST(substr(s.end_time, 1, 2) AS INTEGER) - CAST(substr(s.start_time, 1, 2) AS INTEGER))
            ELSE 0
          END
        ), 0) as total_hours
      FROM employees e
      LEFT JOIN shifts s ON e.id = s.employee_id AND s.user_id = ?
      WHERE e.user_id = ?
    `;
    const params: any[] = [req.userId, req.userId];

    if (fromDate) {
      query += ` AND s.date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND s.date <= ?`;
      params.push(toDate);
    }

    query += ` GROUP BY e.id, e.name, e.hourly_rate ORDER BY e.name`;

    const payroll = db.prepare(query).all(...params) as any[];

    const summary = payroll.map((p) => ({
      employeeId: p.id,
      employeeName: p.name,
      hourlyRate: p.hourly_rate,
      totalShifts: p.total_shifts,
      totalHours: p.total_hours,
      totalPayroll: p.hourly_rate ? Number((p.total_hours * p.hourly_rate).toFixed(2)) : 0,
    }));

    const grandTotal = summary.reduce((sum, s) => sum + (s.totalPayroll || 0), 0);

    res.json({
      summary,
      grandTotal: Number(grandTotal.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
});

export default router;
