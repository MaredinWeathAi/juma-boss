import { Router } from 'express';
import { getDatabase } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Calculate price based on recipe, labor, and margin
router.post('/calculate', authenticateToken, (req: AuthRequest, res) => {
  const { ingredients, laborHours, laborCostPerHour, packagingCost, desiredMarginPercent } = req.body;

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    res.status(400).json({ error: 'Ingredients array is required' });
    return;
  }

  const db = getDatabase();

  try {
    let ingredientsCost = 0;
    const ingredientDetails: any[] = [];

    // Calculate ingredients cost
    ingredients.forEach((ingredient: any) => {
      const ing = db.prepare('SELECT * FROM ingredients WHERE id = ? AND user_id = ?').get(ingredient.ingredientId, req.userId) as any;

      if (ing) {
        const cost = (ingredient.quantity || 0) * ing.cost_per_unit;
        ingredientsCost += cost;

        ingredientDetails.push({
          id: ingredient.ingredientId,
          name: ing.name,
          quantity: ingredient.quantity,
          unit: ing.unit,
          costPerUnit: ing.cost_per_unit,
          totalCost: cost,
        });
      }
    });

    // Calculate labor cost
    const laborCost = (laborHours || 0) * (laborCostPerHour || 15);

    // Calculate total cost
    const totalCost = ingredientsCost + laborCost + (packagingCost || 0);

    // Calculate suggested price based on margin
    const margin = (desiredMarginPercent || 40) / 100;
    const suggestedPrice = totalCost / (1 - margin);

    // Market comparison (just for reference - would come from market data in production)
    const profitMargin = ((suggestedPrice - totalCost) / suggestedPrice * 100).toFixed(2);

    res.json({
      ingredientsCost: Number(ingredientsCost.toFixed(2)),
      laborCost: Number(laborCost.toFixed(2)),
      packagingCost: packagingCost || 0,
      totalCost: Number(totalCost.toFixed(2)),
      desiredMarginPercent,
      suggestedPrice: Number(suggestedPrice.toFixed(2)),
      profitMargin: Number(profitMargin),
      ingredients: ingredientDetails,
      breakdown: {
        ingredientPercentage: Number(((ingredientsCost / totalCost) * 100).toFixed(2)),
        laborPercentage: Number(((laborCost / totalCost) * 100).toFixed(2)),
        packagingPercentage: Number((((packagingCost || 0) / totalCost) * 100).toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

// Get pricing for a specific product
router.get('/product/:productId', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(req.params.productId, req.userId) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Get recipe ingredients
    const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(req.params.productId) as any;
    let ingredientsCost = 0;
    let ingredients: any[] = [];

    if (recipe) {
      const recipeIngredients = db
        .prepare(`
          SELECT ri.*, i.name, i.unit, i.cost_per_unit
          FROM recipe_ingredients ri
          JOIN ingredients i ON ri.ingredient_id = i.id
          WHERE ri.recipe_id = ?
        `)
        .all(recipe.id) as any[];

      ingredients = recipeIngredients.map((ri) => ({
        id: ri.ingredient_id,
        name: ri.name,
        quantity: ri.quantity,
        unit: ri.unit,
        costPerUnit: ri.cost_per_unit,
        totalCost: ri.quantity * ri.cost_per_unit,
      }));

      ingredientsCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
    }

    const profitAmount = product.base_price - product.cost_price;
    const profitMargin = product.cost_price > 0 ? ((profitAmount / product.base_price) * 100).toFixed(2) : 0;

    res.json({
      productId: product.id,
      name: product.name,
      basePrice: product.base_price,
      costPrice: product.cost_price,
      profitAmount: Number(profitAmount.toFixed(2)),
      profitMargin: Number(profitMargin),
      ingredientsCost: Number(ingredientsCost.toFixed(2)),
      prepTimeMinutes: product.prep_time_minutes,
      ingredients,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product pricing' });
  }
});

// Get profitability analysis for all products
router.get('/analysis/profitability', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const products = db
      .prepare(`
        SELECT
          p.id,
          p.name,
          p.base_price,
          p.cost_price,
          p.category,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue,
          COUNT(DISTINCT oi.order_id) as times_ordered
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
        WHERE p.user_id = ?
        GROUP BY p.id, p.name, p.base_price, p.cost_price, p.category
        ORDER BY total_revenue DESC
      `)
      .all(req.userId) as any[];

    const result = products.map((p) => {
      const profitAmount = p.base_price - p.cost_price;
      const profitMargin = p.cost_price > 0 ? ((profitAmount / p.base_price) * 100).toFixed(2) : 0;
      const totalProfit = (p.total_revenue - p.cost_price * p.total_sold).toFixed(2);

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        basePrice: p.base_price,
        costPrice: p.cost_price,
        profitPerUnit: Number(profitAmount.toFixed(2)),
        profitMargin: Number(profitMargin),
        totalSold: p.total_sold,
        totalRevenue: p.total_revenue,
        totalProfit: Number(totalProfit),
        timesOrdered: p.times_ordered,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profitability analysis' });
  }
});

// Get pricing recommendations
router.get('/recommendations', authenticateToken, (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const products = db.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY base_price DESC').all(req.userId) as any[];

    const recommendations: any[] = [];

    products.forEach((product) => {
      const recipe = db.prepare('SELECT * FROM recipes WHERE product_id = ?').get(product.id) as any;

      if (recipe) {
        db
          .prepare(`
            SELECT COALESCE(SUM(ri.quantity * i.cost_per_unit), 0) as total
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = ?
          `)
          .get(recipe.id) as any;
      }

      const currentMargin = product.cost_price > 0 ? ((product.base_price - product.cost_price) / product.base_price * 100).toFixed(2) : 0;

      // Recommend if margin is too low (<30%) or too high (>60%)
      const marginPercent = Number(currentMargin);

      if (marginPercent < 30) {
        recommendations.push({
          productId: product.id,
          productName: product.name,
          type: 'raise-price',
          currentPrice: product.base_price,
          currentMargin: marginPercent,
          suggestedPrice: Number((product.cost_price / 0.7).toFixed(2)),
          reason: 'Margin is below 30%. Consider raising price for better profitability.',
        });
      } else if (marginPercent > 60) {
        recommendations.push({
          productId: product.id,
          productName: product.name,
          type: 'lower-price',
          currentPrice: product.base_price,
          currentMargin: marginPercent,
          suggestedPrice: Number((product.cost_price / 0.5).toFixed(2)),
          reason: 'Margin exceeds 60%. Consider lowering price to increase market competitiveness.',
        });
      }
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing recommendations' });
  }
});

export default router;
