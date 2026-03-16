import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { requireTier } from '../middleware/tierGuard.js';

const router = Router();

// GET all ingredients with low stock alerts
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const ingredients = db
      .prepare(`
        SELECT * FROM ingredients
        WHERE user_id = ?
        ORDER BY category, name
      `)
      .all(req.userId) as any[];

    const result = ingredients.map((ing) => {
      const isLowStock = ing.min_stock_level && ing.current_stock < ing.min_stock_level;
      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        costPerUnit: ing.cost_per_unit,
        currentStock: ing.current_stock,
        minStockLevel: ing.min_stock_level,
        category: ing.category,
        isLowStock,
        totalValue: ing.current_stock * ing.cost_per_unit,
        createdAt: ing.created_at,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET low stock alerts only
router.get('/alerts/low-stock', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const alerts = db
      .prepare(`
        SELECT * FROM ingredients
        WHERE user_id = ? AND min_stock_level IS NOT NULL AND current_stock < min_stock_level
        ORDER BY (min_stock_level - current_stock) DESC
      `)
      .all(req.userId) as any[];

    const result = alerts.map((ing) => ({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      currentStock: ing.current_stock,
      minStockLevel: ing.min_stock_level,
      stockGap: ing.min_stock_level - ing.current_stock,
      category: ing.category,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET single ingredient
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' });
      return;
    }

    // Get usage in recipes
    const recipeUsage = db
      .prepare(
        `
        SELECT DISTINCT p.id, p.name, ri.quantity, ri.unit
        FROM recipe_ingredients ri
        JOIN recipes r ON ri.recipe_id = r.id
        JOIN products p ON r.product_id = p.id
        WHERE ri.ingredient_id = ? AND p.user_id = ?
      `
      )
      .all(req.params.id, req.userId) as any[];

    res.json({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: ingredient.cost_per_unit,
      currentStock: ingredient.current_stock,
      minStockLevel: ingredient.min_stock_level,
      category: ingredient.category,
      totalValue: ingredient.current_stock * ingredient.cost_per_unit,
      usedInProducts: recipeUsage.map((r) => ({
        productId: r.id,
        productName: r.name,
        quantityPerUnit: r.quantity,
        unit: r.unit,
      })),
      createdAt: ingredient.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ingredient' });
  }
});

// CREATE ingredient
router.post('/', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const { name, unit, costPerUnit, currentStock, minStockLevel, category } = req.body;

  if (!name || !unit || costPerUnit === undefined) {
    res.status(400).json({ error: 'Name, unit, and cost per unit are required' });
    return;
  }

  const db = getDatabase();

  try {
    const ingredientId = uuidv4();

    db.prepare(`
      INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, current_stock, min_stock_level, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ingredientId,
      req.userId,
      name,
      unit,
      costPerUnit,
      currentStock || 0,
      minStockLevel || null,
      category || null,
      new Date().toISOString()
    );

    res.status(201).json({
      id: ingredientId,
      name,
      unit,
      costPerUnit,
      currentStock: currentStock || 0,
      minStockLevel,
      category,
      totalValue: (currentStock || 0) * costPerUnit,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// UPDATE ingredient
router.put('/:id', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const { name, unit, costPerUnit, currentStock, minStockLevel, category } = req.body;
  const db = getDatabase();

  try {
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' });
      return;
    }

    db.prepare(`
      UPDATE ingredients
      SET name = ?, unit = ?, cost_per_unit = ?, current_stock = ?, min_stock_level = ?, category = ?
      WHERE id = ?
    `).run(
      name || ingredient.name,
      unit || ingredient.unit,
      costPerUnit !== undefined ? costPerUnit : ingredient.cost_per_unit,
      currentStock !== undefined ? currentStock : ingredient.current_stock,
      minStockLevel !== undefined ? minStockLevel : ingredient.min_stock_level,
      category !== undefined ? category : ingredient.category,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      name: updated.name,
      unit: updated.unit,
      costPerUnit: updated.cost_per_unit,
      currentStock: updated.current_stock,
      minStockLevel: updated.min_stock_level,
      category: updated.category,
      totalValue: updated.current_stock * updated.cost_per_unit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// UPDATE stock quantity
router.put('/:id/stock', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const { quantity, operation } = req.body;

  if (quantity === undefined || !operation) {
    res.status(400).json({ error: 'Quantity and operation (add/subtract/set) are required' });
    return;
  }

  const db = getDatabase();

  try {
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' });
      return;
    }

    let newStock = ingredient.current_stock;

    if (operation === 'add') {
      newStock += quantity;
    } else if (operation === 'subtract') {
      newStock = Math.max(0, ingredient.current_stock - quantity);
    } else if (operation === 'set') {
      newStock = quantity;
    } else {
      res.status(400).json({ error: 'Invalid operation' });
      return;
    }

    db.prepare('UPDATE ingredients SET current_stock = ? WHERE id = ?').run(newStock, req.params.id);

    const updated = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      name: updated.name,
      previousStock: ingredient.current_stock,
      currentStock: updated.current_stock,
      operation,
      totalValue: updated.current_stock * updated.cost_per_unit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// DELETE ingredient
router.delete('/:id', authenticateToken, requireTier('growing'), (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' });
      return;
    }

    // Check if ingredient is used in recipes
    const usage = db.prepare('SELECT COUNT(*) as count FROM recipe_ingredients WHERE ingredient_id = ?').get(req.params.id) as any;

    if (usage.count > 0) {
      res.status(400).json({ error: 'Cannot delete ingredient that is used in recipes' });
      return;
    }

    db.prepare('DELETE FROM ingredients WHERE id = ?').run(req.params.id);

    res.json({ message: 'Ingredient deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

// GET inventory cost analysis
router.get('/analysis/totals', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const stats = db
      .prepare(
        `
        SELECT
          COUNT(*) as total_items,
          SUM(current_stock * cost_per_unit) as total_inventory_value,
          AVG(cost_per_unit) as avg_cost_per_item,
          SUM(CASE WHEN min_stock_level IS NOT NULL AND current_stock < min_stock_level THEN 1 ELSE 0 END) as low_stock_count
        FROM ingredients
        WHERE user_id = ?
      `
      )
      .get(req.userId) as any;

    const byCategory = db
      .prepare(
        `
        SELECT
          category,
          COUNT(*) as item_count,
          SUM(current_stock * cost_per_unit) as category_value
        FROM ingredients
        WHERE user_id = ?
        GROUP BY category
        ORDER BY category_value DESC
      `
      )
      .all(req.userId) as any[];

    res.json({
      totals: {
        totalItems: stats.total_items || 0,
        totalInventoryValue: stats.total_inventory_value || 0,
        avgCostPerItem: stats.avg_cost_per_item || 0,
        lowStockCount: stats.low_stock_count || 0,
      },
      byCategory: byCategory.map((cat) => ({
        category: cat.category || 'Uncategorized',
        itemCount: cat.item_count,
        categoryValue: cat.category_value || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory analysis' });
  }
});

export default router;
