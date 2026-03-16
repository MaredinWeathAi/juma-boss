import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all products for user
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const products = db.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC').all(req.userId) as any[];

    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      basePrice: p.base_price,
      costPrice: p.cost_price,
      imageUrl: p.image_url,
      isActive: p.is_active,
      prepTimeMinutes: p.prep_time_minutes,
      margin: ((p.base_price - p.cost_price) / p.base_price * 100).toFixed(1),
      createdAt: p.created_at,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Get recipe and ingredients
    const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(product.id) as any;
    let recipeIngredients: any[] = [];

    if (recipe) {
      recipeIngredients = db
        .prepare(
          `SELECT ri.*, i.name, i.unit, i.cost_per_unit
         FROM recipe_ingredients ri
         JOIN ingredients i ON ri.ingredient_id = i.id
         WHERE ri.recipe_id = ?`
        )
        .all(recipe.id) as any[];
    }

    res.json({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      basePrice: product.base_price,
      costPrice: product.cost_price,
      imageUrl: product.image_url,
      isActive: product.is_active,
      prepTimeMinutes: product.prep_time_minutes,
      recipeId: recipe?.id,
      ingredients: recipeIngredients.map((ri) => ({
        id: ri.ingredient_id,
        name: ri.name,
        quantity: ri.quantity,
        unit: ri.unit,
        costPerUnit: ri.cost_per_unit,
        totalCost: ri.quantity * ri.cost_per_unit,
      })),
      createdAt: product.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// CREATE product
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { name, description, category, basePrice, costPrice, imageUrl, prepTimeMinutes } = req.body;

  if (!name || !category || basePrice === undefined || costPrice === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const db = getDatabase();

  try {
    const productId = uuidv4();

    db.prepare(`
      INSERT INTO products (id, user_id, name, description, category, base_price, cost_price, image_url, is_active, prep_time_minutes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId,
      req.userId,
      name,
      description || null,
      category,
      basePrice,
      costPrice,
      imageUrl || null,
      1,
      prepTimeMinutes || null,
      new Date().toISOString()
    );

    // Create empty recipe
    const recipeId = uuidv4();
    db.prepare(`
      INSERT INTO recipes (id, product_id, user_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(recipeId, productId, req.userId, new Date().toISOString());

    res.status(201).json({
      id: productId,
      name,
      description,
      category,
      basePrice,
      costPrice,
      imageUrl,
      isActive: true,
      prepTimeMinutes,
      recipeId,
      ingredients: [],
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE product
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { name, description, category, basePrice, costPrice, imageUrl, prepTimeMinutes, isActive } = req.body;
  const db = getDatabase();

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    db.prepare(`
      UPDATE products
      SET name = ?, description = ?, category = ?, base_price = ?, cost_price = ?, image_url = ?, is_active = ?, prep_time_minutes = ?
      WHERE id = ?
    `).run(
      name || product.name,
      description !== undefined ? description : product.description,
      category || product.category,
      basePrice !== undefined ? basePrice : product.base_price,
      costPrice !== undefined ? costPrice : product.cost_price,
      imageUrl !== undefined ? imageUrl : product.image_url,
      isActive !== undefined ? (isActive ? 1 : 0) : product.is_active,
      prepTimeMinutes !== undefined ? prepTimeMinutes : product.prep_time_minutes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;

    res.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      category: updated.category,
      basePrice: updated.base_price,
      costPrice: updated.cost_price,
      imageUrl: updated.image_url,
      isActive: updated.is_active,
      prepTimeMinutes: updated.prep_time_minutes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);

    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Add ingredient to recipe
router.post('/:id/recipe-ingredients', authenticateToken, (req: AuthRequest, res) => {
  const { ingredientId, quantity, unit } = req.body;
  const db = getDatabase();

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(req.params.id) as any;

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ? AND user_id = ?').get(ingredientId, req.userId) as any;

    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' });
      return;
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, recipe.id, ingredientId, quantity, unit || ingredient.unit);

    res.status(201).json({
      id,
      ingredientId,
      name: ingredient.name,
      quantity,
      unit: unit || ingredient.unit,
      costPerUnit: ingredient.cost_per_unit,
      totalCost: quantity * ingredient.cost_per_unit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add ingredient' });
  }
});

// Remove ingredient from recipe
router.delete('/:id/recipe-ingredients/:ingredientId', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    db.prepare('DELETE FROM recipe_ingredients WHERE id = ?').run(req.params.ingredientId);

    res.json({ message: 'Ingredient removed from recipe' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove ingredient' });
  }
});

export default router;
